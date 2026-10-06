# Slice B evidence

## B9 — Lambda packaging does not pick up the frozen-vector file

2026-10-06: `scripts/package-lambda.sh` copies exactly two trees into the deploy package, `apps/backend/dist` and `apps/backend/data` (lines 47 and 48). The frozen query vectors live at `apps/backend/src/eval/rules-gate/frozen-query-vectors.json`, in neither tree. `tsc -p apps/backend/tsconfig.json --outDir <scratch>` emits only `.js` files for the gate's modules (`eval/rules-gate/{baseline,frozenVectors,rulesGate,stateFacts}.js` and the test) and no `.json` file anywhere under the output, because the gate reads the file with `readFileSync` rather than a JSON import. So the file reaches neither the compiled output nor the Lambda package. Size at first ship: 18 vectors, 39,671 bytes (about 2.2 KB each as base64 float32; about 0.86 MB projected for 393 cases).
