import { PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { ASSET_BUCKET_NAME, AUDIO_ASSET_PREFIX } from "../utils/assets";
import { getS3 } from "../utils/s3";

/**
 * Upload a local audio file to the conjurer-assets bucket using the same
 * Cognito identity pool credentials as the web app (no AWS CLI profile needed).
 *
 * Usage: ts-node --project tsconfig.script.json src/scripts/uploadLocalAudioToS3.ts <filename> <localPath>
 */
const main = async () => {
  const filename = process.argv[2];
  const localPath = process.argv[3];

  if (!filename || !localPath) {
    console.error(
      "Usage: uploadLocalAudioToS3.ts <filename> <localPath>",
    );
    process.exit(1);
  }

  const body = readFileSync(localPath);
  const contentType = filename.toLowerCase().endsWith(".mp3")
    ? "audio/mpeg"
    : "application/octet-stream";

  await getS3().send(
    new PutObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${AUDIO_ASSET_PREFIX}${filename}`,
      Body: body,
      ContentType: contentType,
    }),
  );

  console.log(
    `Uploaded s3://${ASSET_BUCKET_NAME}/${AUDIO_ASSET_PREFIX}${filename}`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
