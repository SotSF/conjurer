import { ASSET_BUCKET_NAME, AUDIO_ASSET_PREFIX } from "@/src/utils/assets";
import { getS3 } from "@/src/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const uploadAudioFileToS3 = async (file: File, filename: string) => {
  const putObjectCommand = new PutObjectCommand({
    Bucket: ASSET_BUCKET_NAME,
    Key: `${AUDIO_ASSET_PREFIX}${filename}`,
    Body: file,
  });
  return getS3().send(putObjectCommand);
};

export const uploadAudioFileToServer = async (file: File, filename: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", filename);
  await fetch("/api/upload", { method: "POST", body: formData });
};
