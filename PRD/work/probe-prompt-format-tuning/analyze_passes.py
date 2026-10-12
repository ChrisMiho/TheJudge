"""Aggregate the five suite passes. Aggregates print to stdout (safe to commit:
counts, levels, sections, tags only). Per-question detail goes to a gitignored
local file under output/practice-suite/reports/ -- never into PRD/.

usage: python3 -I analyze_passes.py <worktree root>
"""
import collections, hashlib, json, os, statistics, sys

root = sys.argv[1]
runs = os.path.join(root, "output/practice-suite/runs")
cases_dir = os.path.join(root, "output/practice-suite/cases")
passes = sorted(d for d in os.listdir(runs) if d.startswith("pft-pass"))

def half(case_id):
    h = hashlib.sha256(("pft-split-1:" + case_id).encode()).digest()[0]
    return "tuning" if h % 2 == 0 else "check"

meta = {}
for name in os.listdir(cases_dir):
    d = json.load(open(os.path.join(cases_dir, name)))
    meta[d["id"]] = d["suite"]

per_case = collections.defaultdict(dict)  # case -> pass -> record
honesty = collections.Counter()
cost = collections.defaultdict(float)
lat = []
for p in passes:
    path = os.path.join(runs, p, "calls.jsonl")
    if not os.path.exists(path):
        continue
    for line in open(path):
        if '"type":"record"' not in line:
            continue
        r = json.loads(line)["record"]
        honesty[(r.get("embeddingProvider"), r.get("reportedModel"), r.get("status"))] += 1
        cost[p] += (r.get("costUsd") or 0) + (r.get("judgeCostUsd") or 0)
        if r.get("latencyMs") is not None:
            lat.append(r["latencyMs"])
        per_case[r["caseId"]][p] = r

def right(r):
    return r.get("status") == "ok" and (r.get("scores") or {}).get("correctness") == 2

print("passes:", passes)
print("records per pass:", {p: sum(1 for c in per_case.values() if p in c) for p in passes})
print("cost per pass:", {p: round(v, 2) for p, v in cost.items()}, "total", round(sum(cost.values()), 2))
print("honesty (provider, model, status):", dict(honesty))
for p in passes:
    rs = [c[p] for c in per_case.values() if p in c]
    if rs:
        dist = collections.Counter((r.get("scores") or {}).get("correctness") for r in rs)
        print(f"  {p}: agree {sum(map(right, rs))}/{len(rs)} correctness dist {dict(dist)} undetermined {sum(bool(r.get('undetermined')) for r in rs)}")
if lat:
    lat.sort()
    print(f"latency ms: median {statistics.median(lat):.0f} p95 {lat[int(len(lat)*.95)]} max {lat[-1]} over30s {sum(l > 30000 for l in lat)}")

complete = {c: v for c, v in per_case.items() if all(p in v for p in passes)}
print(f"\nquestions answered in every pass: {len(complete)}")
k_of = {c: sum(right(v[p]) for p in passes) for c, v in complete.items()}
n = len(passes)
print("agreeing passes per question:", dict(sorted(collections.Counter(k_of.values()).items())))

def bucket(k):
    return "always" if k == n else "never" if k == 0 else "majority" if k > n / 2 else "minority"

def table(title, keyfn):
    rows = collections.defaultdict(collections.Counter)
    for c, k in k_of.items():
        for key in keyfn(c):
            rows[key][bucket(k)] += 1
            rows[key]["n"] += 1
    print(f"\n{title}  (n / always / majority / minority / never)")
    for key in sorted(rows, key=lambda x: str(x)):
        r = rows[key]
        print(f"  {key}: {r['n']} / {r['always']} / {r['majority']} / {r['minority']} / {r['never']}")

table("By half", lambda c: [half(c)])
table("By level", lambda c: [meta[c]["level"]])
table("By complexity", lambda c: [meta[c]["complexity"]])
table("By rules section", lambda c: sorted({r[:3] for r in meta[c]["citedRuleIds"]}))
table("By tag", lambda c: meta[c]["tags"] or ["(none)"])

def reach(c):
    r = complete[c][passes[0]]
    return [f"allDecidingRulesInPrompt={r.get('allDecidingRulesInPrompt')}"]
table("By retrieval reach", reach)

out = os.path.join(root, "output/practice-suite/reports/pft-variability.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({c: {"half": half(c), "agree": k_of[c], "level": meta[c]["level"],
               "complexity": meta[c]["complexity"], "tags": meta[c]["tags"],
               "cited": meta[c]["citedRuleIds"],
               "correctness": [ (complete[c][p].get("scores") or {}).get("correctness") for p in passes]}
           for c in k_of}, open(out, "w"), indent=1)
print("\nper-question detail (local only):", out)
