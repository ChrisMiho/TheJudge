// REQ-181/NFR-017: stub replacing the real `onnxruntime-web` package (a
// ~130MB browser/WebGPU ONNX runtime with no Node execution path) for this
// backend's Lambda deployment. `@huggingface/transformers` statically
// imports `onnxruntime-web/webgpu` in every build, including its Node build
// (`dist/transformers.node.mjs`), for a browser code path this backend never
// takes — verified: the import is only ever assigned to a namespace
// variable used when the detected environment is NOT Node; when running in
// Node (this backend, always), `onnxruntime-node` is selected instead and
// nothing here is invoked. Wired in via the root `package.json` `overrides`
// field so it resolves everywhere `onnxruntime-web` would, keeping the
// shipped non-data footprint to the real Node ONNX runtime instead of an
// extra ~130MB of browser-only code that never executes server-side.
export default {};
export const env = {};
export class InferenceSession {}
export class Tensor {}
