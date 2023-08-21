import {
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  AUDIO_ASSET_PREFIX,
  EXPERIENCE_ASSET_PREFIX,
  LOCAL_ASSET_PATH,
} from "../utils/assets";
import * as fs from "fs";

export const createDirectory = (path: string) => {
  if (!fs.existsSync(path)) fs.mkdirSync(path);
};

export const copyDirectory = (src: string, dest: string): Promise<void> =>
  new Promise<void>((resolve, reject) =>
    fs.cp(src, dest, { recursive: true }, (err) =>
      err ? reject(err) : resolve()
    )
  );

export const saveJson = (filename: string, data: any) =>
  fs.writeFileSync(filename, JSON.stringify(data));

export const setupAssetDirectories = () => {
  createDirectory(LOCAL_ASSET_PATH);
  createDirectory(LOCAL_ASSET_PATH + EXPERIENCE_ASSET_PREFIX);
  createDirectory(LOCAL_ASSET_PATH + AUDIO_ASSET_PREFIX);
};

export const downloadExperiences = async (s3: S3Client) => {
  const listObjectsCommand = new ListObjectsCommand({
    Bucket: ASSET_BUCKET_NAME,
    Prefix: EXPERIENCE_ASSET_PREFIX,
  });
  const data = await s3.send(listObjectsCommand);

  for (const object of data.Contents ?? []) {
    const filename = object.Key?.split("/")[1] ?? "";
    const getObjectCommand = new GetObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${EXPERIENCE_ASSET_PREFIX}${filename}`,
    });
    const data = await s3.send(getObjectCommand);
    const experienceString = await data.Body?.transformToString();
    if (experienceString) {
      const experience = JSON.parse(experienceString);
      saveJson(
        `${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}${filename}`,
        experience
      );
    }
  }
};

export const backupExperiences = async () =>
  await copyDirectory(
    `${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}`,
    `${LOCAL_ASSET_PATH}${Date.now()}_backup_${EXPERIENCE_ASSET_PREFIX}`
  );

export const downloadAudio = async (s3: S3Client) => {
  const listObjectsCommand = new ListObjectsCommand({
    Bucket: ASSET_BUCKET_NAME,
    Prefix: AUDIO_ASSET_PREFIX,
  });
  const data = await s3.send(listObjectsCommand);

  for (const object of data.Contents ?? []) {
    const filename = object.Key?.split("/")[1] ?? "";
    const getObjectCommand = new GetObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${AUDIO_ASSET_PREFIX}${filename}`,
    });
    const data = await s3.send(getObjectCommand);
    const audioData = await data.Body?.transformToByteArray();
    if (audioData?.length)
      fs.writeFileSync(
        `${LOCAL_ASSET_PATH}${AUDIO_ASSET_PREFIX}${filename}`,
        Buffer.from(audioData)
      );
  }
};
