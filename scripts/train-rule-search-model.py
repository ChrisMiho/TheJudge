# REQ-236: trains the Magic search model -- `all-MiniLM-L6-v2` fine-tuned on Magic question -> deciding-rule
# pairs -- and exports it as ONNX (fp32 + dynamic int8, the layout transformers.js loads). Dev-only and
# owner-run: Python 3.12 through `uv`, never in `npm test`, `npm run quality:check` or CI, never a runtime
# dependency. Reads the training pairs `scripts/export-rule-search-training.mjs` wrote (a git-ignored
# folder) and writes checkpoints and models only under a git-ignored folder. Prints counts only.
#
# Recipe (REQ-236): base sentence-transformers/all-MiniLM-L6-v2; cached MultipleNegativesRankingLoss;
# batch 32 (mini-batch 16) with no-duplicates batching; learning rate 5e-5; 4 epochs; 10% warmup; max length
# 512; seed 13; one hard negative per pair. Export: ONNX opset 14, then dynamic int8 quantisation,
# per-channel, reduced range (matching the bundled stock model's layout).
#
# Set up once (from the repository root):
#   uv venv --python 3.12 output/rule-search-model/venv
#   uv pip install --python output/rule-search-model/venv/bin/python -r scripts/rule-search-model.requirements.txt
# Run (one model folder per fold; `--fold all` is the shipped model, trained on 100% of the data):
#   output/rule-search-model/venv/bin/python -I scripts/train-rule-search-model.py --fold 0 --export
#   output/rule-search-model/venv/bin/python -I scripts/train-rule-search-model.py --cv --export
#   output/rule-search-model/venv/bin/python -I scripts/train-rule-search-model.py --fold all --export
import argparse
import json
import os
import random
import shutil
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
WORK = REPO / "output" / "rule-search-model"
BASE = "sentence-transformers/all-MiniLM-L6-v2"
# tokenizer and config come from the bundled stock model's folder (same vocabulary, same layout)
STOCK = REPO / "apps" / "backend" / "data" / "models" / "Xenova" / "all-MiniLM-L6-v2"

ap = argparse.ArgumentParser()
ap.add_argument("--fold", default=None, help="the held-out fold 0-4, or 'all' for the shipped model trained on every question")
ap.add_argument("--cv", action="store_true", help="train and (with --export) export the five fold models")
ap.add_argument("--dev-fold", default=None, help="optional fold used only to print per-epoch recall")
ap.add_argument("--no-suite", action="store_true", help="leave the practice questions out (corpus + rule-book examples only)")
ap.add_argument("--epochs", type=float, default=4)
ap.add_argument("--lr", type=float, default=5e-5)
ap.add_argument("--batch", type=int, default=32)
ap.add_argument("--negs", type=int, default=1, help="hard negatives per pair (0 = in-batch only)")
ap.add_argument("--max-len", type=int, default=512)
ap.add_argument("--seed", type=int, default=13)
ap.add_argument("--name", default=None)
ap.add_argument("--export", action="store_true")
ap.add_argument("--base-only", action="store_true", help="export the untrained base model (export fidelity check)")
ap.add_argument("--data-dir", default=str(WORK / "data"))
ap.add_argument("--work-dir", default=str(WORK))
ap.add_argument("--hf-home", default=str(WORK / "hf"), help="local Hugging Face cache holding the base model (nothing is downloaded)")
a = ap.parse_args()

work = Path(a.work_dir)
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HOME", a.hf_home)
os.environ.setdefault("HF_HUB_OFFLINE", "1")
import torch  # noqa: E402
from sentence_transformers import SentenceTransformer, SentenceTransformerTrainer, SentenceTransformerTrainingArguments, losses  # noqa: E402
from sentence_transformers.training_args import BatchSamplers  # noqa: E402
from sentence_transformers.evaluation import InformationRetrievalEvaluator  # noqa: E402
from datasets import Dataset  # noqa: E402

device = "mps" if torch.backends.mps.is_available() else "cpu"


def export_onnx(model, out_dir: Path):
    """fp32 ONNX of the transformer (last_hidden_state; pooling is done by transformers.js) + dynamic int8."""
    from onnxruntime.quantization import quantize_dynamic, QuantType

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "onnx").mkdir(exist_ok=True)
    for f in ["config.json", "tokenizer.json", "tokenizer_config.json"]:
        shutil.copy(STOCK / f, out_dir / f)
    bert = model[0].auto_model.to("cpu").eval()
    bert.config.return_dict = True
    ids = torch.ones(1, 8, dtype=torch.long)

    class Wrap(torch.nn.Module):
        def __init__(self, m):
            super().__init__()
            self.m = m

        def forward(self, input_ids, attention_mask, token_type_ids):
            return self.m(input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids).last_hidden_state

    fp32 = out_dir / "onnx" / "model.onnx"
    torch.onnx.export(
        Wrap(bert),
        (ids, ids, torch.zeros_like(ids)),
        str(fp32),
        input_names=["input_ids", "attention_mask", "token_type_ids"],
        output_names=["last_hidden_state"],
        dynamic_axes={k: {0: "batch", 1: "seq"} for k in ["input_ids", "attention_mask", "token_type_ids", "last_hidden_state"]},
        opset_version=14,
        dynamo=False,
    )
    # per-channel, 7-bit range: matches the bundled stock q8 (a per-tensor export lost 23 citations at intake)
    quantize_dynamic(str(fp32), str(out_dir / "onnx" / "model_quantized.onnx"), weight_type=QuantType.QInt8, per_channel=True, reduce_range=True)
    print(f"exported {out_dir.name}: fp32 {fp32.stat().st_size / 1e6:.1f} MB, q8 {(out_dir / 'onnx' / 'model_quantized.onnx').stat().st_size / 1e6:.1f} MB")


def train_one(test_fold, name):
    random.seed(a.seed)
    torch.manual_seed(a.seed)
    data = Path(a.data_dir)
    rules = json.loads((data / "rules.json").read_text())
    cases = [json.loads(line) for line in (data / "cases.jsonl").read_text().split("\n") if line.strip()]
    examples = [json.loads(line) for line in (data / "examples.jsonl").read_text().split("\n") if line.strip()]
    ckpt = work / "ckpt" / name

    model = SentenceTransformer(BASE, device=device, model_kwargs={"attn_implementation": "eager"})
    model.max_seq_length = a.max_len
    tf = None if test_fold == "all" else int(test_fold)
    df = None if a.dev_fold is None else int(a.dev_fold)
    use = [c for c in cases if c["fold"] != tf and c["fold"] != df and (not a.no_suite or c["set"] == "corpus")]
    rows = {"anchor": [], "positive": []}
    for k in range(a.negs):
        rows[f"negative_{k}"] = []

    def add(query, positive, negs, salt):
        if a.negs and len(negs) < a.negs:
            return
        rows["anchor"].append(query)
        rows["positive"].append(positive)
        for k in range(a.negs):
            rows[f"negative_{k}"].append(rules[negs[(salt + k) % len(negs)]])

    for c in use:
        for j, rid in enumerate(c["positives"]):
            add(c["query"], rules[rid], c["negs"], j * a.negs)
    for e in examples:
        add(e["query"], e["doc"], e["negs"], 0)
    ds = Dataset.from_dict(rows).shuffle(seed=a.seed)
    print(f"[{name}] train pairs {len(ds)} (questions {len(use)}; examples {len(examples)}); device {device}")

    evaluator = None
    if df is not None:
        dev = [c for c in cases if c["fold"] == df and c["positives"]]
        evaluator = InformationRetrievalEvaluator(
            queries={str(i): c["query"] for i, c in enumerate(dev)},
            corpus=rules,
            relevant_docs={str(i): set(c["positives"]) for i, c in enumerate(dev)},
            accuracy_at_k=[10],
            precision_recall_at_k=[10, 30, 100],
            mrr_at_k=[10],
            ndcg_at_k=[10],
            map_at_k=[100],
            show_progress_bar=False,
            batch_size=16,
            name="dev",
        )

    args = SentenceTransformerTrainingArguments(
        output_dir=str(work / "tmp" / name),
        num_train_epochs=a.epochs,
        per_device_train_batch_size=a.batch,
        learning_rate=a.lr,
        warmup_ratio=0.1,
        batch_sampler=BatchSamplers.NO_DUPLICATES,
        save_strategy="no",
        logging_steps=50,
        report_to=[],
        seed=a.seed,
        disable_tqdm=True,
        eval_strategy="epoch" if evaluator else "no",
        dataloader_drop_last=False,
    )
    trainer = SentenceTransformerTrainer(
        model=model, args=args, train_dataset=ds, loss=losses.CachedMultipleNegativesRankingLoss(model, mini_batch_size=16), evaluator=evaluator
    )
    t0 = time.time()
    trainer.train()
    secs = time.time() - t0
    print(f"[{name}] trained in {secs:.0f} s")
    if evaluator:
        for rec in trainer.state.log_history:
            if "eval_dev_cosine_recall@10" in rec:
                print(f"[{name}] epoch {rec['epoch']:.0f}: dev recall@10 {rec['eval_dev_cosine_recall@10']:.4f} @100 {rec['eval_dev_cosine_recall@100']:.4f}")
    ckpt.mkdir(parents=True, exist_ok=True)
    model.save(str(ckpt))
    (ckpt / "train-meta.json").write_text(json.dumps({"pairs": len(ds), "seconds": secs, "args": vars(a)}))
    if a.export:
        export_onnx(model, work / "onnx" / name)
    shutil.rmtree(work / "tmp" / name, ignore_errors=True)


if a.base_only:
    base = SentenceTransformer(BASE, device=device, model_kwargs={"attn_implementation": "eager"})
    export_onnx(base, work / "onnx" / "base")
elif a.cv:
    for fold in range(5):
        train_one(str(fold), a.name and f"{a.name}-fold{fold}" or f"F-fold{fold}")
elif a.fold is not None:
    train_one(a.fold, a.name or (f"F-fold{a.fold}" if a.fold != "all" else "F-foldall"))
else:
    ap.error("pass --fold <0-4|all>, --cv or --base-only")
