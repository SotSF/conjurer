import {
  ASSET_BUCKET_NAME,
  AUDIO_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const uploadAudioFile = async (file: File) => {
  const putObjectCommand = new PutObjectCommand({
    Bucket: ASSET_BUCKET_NAME,
    Key: `${AUDIO_ASSET_PREFIX}${file.name}`,
    Body: file,
  });
  return getS3().send(putObjectCommand);
};
