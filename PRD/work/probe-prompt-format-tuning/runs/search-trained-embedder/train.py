# Free, local probe (no API calls, no LLM): fine-tune all-MiniLM-L6-v2 on Magic question -> deciding-rule
# pairs (MultipleNegativesRankingLoss + one hard negative mined from today's search), and export the
# model to ONNX (fp32 + dynamic int8, same layout transformers.js loads in production).
# Data comes from export-training.mjs (git-ignored worktree folder). Prints aggregate numbers only.
#
#   venv/bin/python -I train.py --arm F --test-fold 0            # practice + corpus + rule-book examples
#   venv/bin/python -I train.py --arm C --test-fold 0            # corpus + rule-book examples only
#   venv/bin/python -I train.py --arm F --test-fold all          # 100% model
#   venv/bin/python -I train.py --arm F --test-fold 0 --dev-fold 1 --epochs 4 --name recipe  # recipe check
import argparse, json, os, random, shutil, time
from pathlib import Path

TRAIN = Path("/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/models-probe/train")
PROD = Path("/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/apps/backend/data/models/Xenova/all-MiniLM-L6-v2")
BASE = "sentence-transformers/all-MiniLM-L6-v2"

ap = argparse.ArgumentParser()
ap.add_argument("--arm", default="F", choices=["F", "C"])
ap.add_argument("--test-fold", default="0")
ap.add_argument("--dev-fold", default=None)
ap.add_argument("--epochs", type=float, default=2)
ap.add_argument("--lr", type=float, default=3e-5)
ap.add_argument("--batch", type=int, default=32)
ap.add_argument("--negs", type=int, default=1, help="hard negatives per pair (0 = in-batch only)")
ap.add_argument("--no-examples", action="store_true")
ap.add_argument("--max-len", type=int, default=512)
ap.add_argument("--name", default=None)
ap.add_argument("--export", action="store_true")
ap.add_argument("--base-only", action="store_true", help="export the untrained base model (fidelity check)")
ap.add_argument("--seed", type=int, default=13)
a = ap.parse_args()

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HOME", str(TRAIN / "hf"))
import torch
from sentence_transformers import SentenceTransformer, SentenceTransformerTrainer, SentenceTransformerTrainingArguments, losses
from sentence_transformers.training_args import BatchSamplers
from sentence_transformers.evaluation import InformationRetrievalEvaluator
from datasets import Dataset

random.seed(a.seed)
torch.manual_seed(a.seed)
D = TRAIN / "data"
rules = json.loads((D / "rules.json").read_text())
cases = [json.loads(l) for l in (D / "cases.jsonl").read_text().split("\n") if l.strip()]
examples = [json.loads(l) for l in (D / "examples.jsonl").read_text().split("\n") if l.strip()]
name = a.name or f"{a.arm}-fold{a.test_fold}"
ckpt = TRAIN / "ckpt" / name
device = "mps" if torch.backends.mps.is_available() else "cpu"


def export_onnx(model, out_dir: Path):
    """fp32 ONNX of the transformer (last_hidden_state; pooling is done by transformers.js) + dynamic int8."""
    from onnxruntime.quantization import quantize_dynamic, QuantType
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "onnx").mkdir(exist_ok=True)
    for f in ["config.json", "tokenizer.json", "tokenizer_config.json"]:
        shutil.copy(PROD / f, out_dir / f)
    bert = model[0].auto_model.to("cpu").eval()
    bert.config.return_dict = True
    ids = torch.ones(1, 8, dtype=torch.long)

    class Wrap(torch.nn.Module):
        def __init__(self, m):
            super().__init__(); self.m = m
        def forward(self, input_ids, attention_mask, token_type_ids):
            return self.m(input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids).last_hidden_state

    fp32 = out_dir / "onnx" / "model.onnx"
    torch.onnx.export(Wrap(bert), (ids, ids, torch.zeros_like(ids)), str(fp32), input_names=["input_ids", "attention_mask", "token_type_ids"],
                      output_names=["last_hidden_state"], dynamic_axes={k: {0: "batch", 1: "seq"} for k in ["input_ids", "attention_mask", "token_type_ids", "last_hidden_state"]},
                      opset_version=14, dynamo=False)
    quantize_dynamic(str(fp32), str(out_dir / "onnx" / "model_quantized.onnx"), weight_type=QuantType.QInt8, per_channel=True, reduce_range=True)  # matches the bundled Xenova q8 (per-channel, 7-bit range)
    print(f"exported {out_dir.name}: fp32 {fp32.stat().st_size/1e6:.1f} MB, q8 {(out_dir/'onnx'/'model_quantized.onnx').stat().st_size/1e6:.1f} MB")


model = SentenceTransformer(BASE, device=device, model_kwargs={"attn_implementation": "eager"})
model.max_seq_length = a.max_len
if a.base_only:
    export_onnx(model, TRAIN / "onnx" / "trained" / "base")
    raise SystemExit

tf = None if a.test_fold == "all" else int(a.test_fold)
df = None if a.dev_fold is None else int(a.dev_fold)
use = [c for c in cases if c["fold"] != tf and c["fold"] != df and (a.arm == "F" or c["set"] == "corpus")]
rows = {"anchor": [], "positive": []}
if a.negs:
    for k in range(a.negs): rows[f"negative_{k}"] = []
def add(q, pos, negs, salt):
    if a.negs and len(negs) < a.negs: return
    rows["anchor"].append(q); rows["positive"].append(pos)
    for k in range(a.negs): rows[f"negative_{k}"].append(rules[negs[(salt + k) % len(negs)]])
for c in use:
    for j, rid in enumerate(c["positives"]):
        add(c["query"], rules[rid], c["negs"], j * a.negs)
if not a.no_examples:
    for e in examples:
        add(e["query"], e["doc"], e["negs"], 0)
ds = Dataset.from_dict(rows).shuffle(seed=a.seed)
print(f"[{name}] train pairs {len(ds)} (questions {len(use)}; examples {0 if a.no_examples else len(examples)}); device {device}")

evaluator = None
if df is not None:
    dev = [c for c in cases if c["fold"] == df and c["positives"]]
    evaluator = InformationRetrievalEvaluator(
        queries={str(i): c["query"] for i, c in enumerate(dev)}, corpus=rules,
        relevant_docs={str(i): set(c["positives"]) for i, c in enumerate(dev)},
        accuracy_at_k=[10], precision_recall_at_k=[10, 30, 100], mrr_at_k=[10], ndcg_at_k=[10], map_at_k=[100],
        show_progress_bar=False, batch_size=16, name="dev")
    base_m = evaluator(model)
    print(f"[{name}] base dev: recall@10 {base_m['dev_cosine_recall@10']:.4f} recall@100 {base_m['dev_cosine_recall@100']:.4f}")

args = SentenceTransformerTrainingArguments(
    output_dir=str(TRAIN / "tmp" / name), num_train_epochs=a.epochs, per_device_train_batch_size=a.batch, learning_rate=a.lr,
    warmup_ratio=0.1, batch_sampler=BatchSamplers.NO_DUPLICATES, save_strategy="no", logging_steps=50, report_to=[], seed=a.seed, disable_tqdm=True,
    eval_strategy="epoch" if evaluator else "no", dataloader_drop_last=False)
trainer = SentenceTransformerTrainer(model=model, args=args, train_dataset=ds, loss=losses.CachedMultipleNegativesRankingLoss(model, mini_batch_size=16), evaluator=evaluator)
t0 = time.time()
trainer.train()
secs = time.time() - t0
print(f"[{name}] trained in {secs:.0f} s")
if evaluator:
    for rec in trainer.state.log_history:
        if "eval_dev_cosine_recall@10" in rec:
            print(f"[{name}] epoch {rec['epoch']:.0f}: dev recall@10 {rec['eval_dev_cosine_recall@10']:.4f} @30 {rec['eval_dev_cosine_recall@30']:.4f} @100 {rec['eval_dev_cosine_recall@100']:.4f}")
model.save(str(ckpt))
(ckpt / "train-meta.json").write_text(json.dumps({"pairs": len(ds), "seconds": secs, "args": vars(a)}))
if a.export:
    export_onnx(model, TRAIN / "onnx" / "trained" / name)
shutil.rmtree(TRAIN / "tmp" / name, ignore_errors=True)
