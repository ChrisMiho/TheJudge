# Uploading the trained rule-search model

The Magic-trained search model (REQ-236, REQ-237) is not in git. The code PR carries only its manifest
(`apps/backend/data/embeddingModel.manifest.json`: model id, base model, and a SHA-256 and size per file).
The weights live in the private artifact bucket under `models/<model-id>/`, and the package step fetches them
into the Lambda bundle (`scripts/fetch-embedding-model.mjs`). Upload them once, **before** merging the code PR.

Model id for this build: `rule-search-d2c2e500a4c6` (4 files, about 23.7 MB).

## Upload (owner, profile `thejudge-admin`)

The model folder is staged by `scripts/package-embedding-model.mjs`; re-stage it from the trained folder if
the staging folder is gone:

```bash
node scripts/package-embedding-model.mjs --model-dir output/rule-search-model/onnx/F-v2-foldall
```

Then, from the checkout that holds `output/rule-search-model/`:

```bash
export AWS_PROFILE=thejudge-admin
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws s3 cp output/rule-search-model/upload/rule-search-d2c2e500a4c6 \
  "s3://thejudge-lambda-artifacts-$ACCOUNT/models/rule-search-d2c2e500a4c6/" --recursive
aws s3 ls "s3://thejudge-lambda-artifacts-$ACCOUNT/models/rule-search-d2c2e500a4c6/" --recursive
```

The listing must show `config.json`, `tokenizer.json`, `tokenizer_config.json` and
`onnx/model_quantized.onnx`.

## Check before merging

```bash
node scripts/fetch-embedding-model.mjs --source "s3://thejudge-lambda-artifacts-$ACCOUNT/models/rule-search-d2c2e500a4c6"
```

The fetch copies the model into the git-ignored `apps/backend/data/models/` and checks every file against the manifest. A hash mismatch fails it, and a deploy built from a missing or altered model
fails rather than silently running the stock model.

## Permissions

`scripts/aws-bootstrap.sh` needs no change for this: the deploy role already holds `s3:GetObject` on every object
in the artifact bucket, `models/` included. Only the owner's admin profile writes there; CI and the deploy role
never upload.

## After the model changes

A new training run gets a new content-addressed id. Re-run `scripts/package-embedding-model.mjs`, rebuild the
rule vectors and the frozen vectors with the new model, and upload the new folder before merging.
