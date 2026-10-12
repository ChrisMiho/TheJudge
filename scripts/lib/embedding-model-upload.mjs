// REQ-237: the exact commands the owner runs to upload a trained model to the private artifact bucket.
// Pure: it only builds the text, so printing it can never touch AWS. The owner runs the commands with the
// admin profile; CI and the deploy role never upload.

export const AWS_ADMIN_PROFILE = "thejudge-admin";
export const ARTIFACT_BUCKET_PREFIX = "thejudge-lambda-artifacts";

/** The commands, in order. `stageDir` is the folder `package-embedding-model.mjs` staged (just the shipped files). */
export function uploadCommands({ modelId, stageDir }) {
  return [
    `export AWS_PROFILE=${AWS_ADMIN_PROFILE}`,
    "ACCOUNT=$(aws sts get-caller-identity --query Account --output text)",
    `aws s3 cp "${stageDir}" "s3://${ARTIFACT_BUCKET_PREFIX}-$ACCOUNT/models/${modelId}/" --recursive`,
    `aws s3 ls "s3://${ARTIFACT_BUCKET_PREFIX}-$ACCOUNT/models/${modelId}/" --recursive`
  ];
}
