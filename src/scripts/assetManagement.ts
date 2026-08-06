import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  AUDIO_ASSET_PREFIX,
  LOCAL_ASSET_PATH,
} from "../utils/assets";
import * as fs from "fs";
import * as path from "path";

export const createDirectory = (pathName: string) => {
  if (!fs.existsSync(pathName)) fs.mkdirSync(pathName);
};

export const copyDirectory = (src: string, dest: string): Promise<void> =>
  new Promise<void>((resolve, reject) =>
    fs.cp(src, dest, { recursive: true }, (err) =>
      err ? reject(err) : resolve(),
    ),
  );

export const saveJson = (filename: string, data: any) =>
  fs.writeFileSync(filename, JSON.stringify(data));

export const setupAssetDirectories = () => {
  createDirectory(LOCAL_ASSET_PATH);
  createDirectory(LOCAL_ASSET_PATH + AUDIO_ASSET_PREFIX);
};

const listAudioObjectKeys = async (s3: S3Client): Promise<string[]> => {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: ASSET_BUCKET_NAME,
        Prefix: AUDIO_ASSET_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key || object.Key.endsWith("/")) continue;
      keys.push(object.Key);
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
};

export const downloadAudio = async (s3: S3Client) => {
  const keys = await listAudioObjectKeys(s3);
  const audioDir = path.join(LOCAL_ASSET_PATH, AUDIO_ASSET_PREFIX);
  let downloaded = 0;
  let skipped = 0;

  console.log(`Found ${keys.length} audio object(s) in S3`);

  for (const key of keys) {
    const filename = key.slice(AUDIO_ASSET_PREFIX.length);
    if (!filename || filename.includes("/")) {
      console.warn(`Skipping unexpected key: ${key}`);
      continue;
    }

    const localPath = path.join(audioDir, filename);
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
      skipped += 1;
      continue;
    }

    const data = await s3.send(
      new GetObjectCommand({
        Bucket: ASSET_BUCKET_NAME,
        Key: key,
      }),
    );
    const audioData = await data.Body?.transformToByteArray();
    if (!audioData?.length) {
      console.warn(`Empty object, skipping: ${key}`);
      continue;
    }

    fs.writeFileSync(localPath, audioData);
    downloaded += 1;
    console.log(`Downloaded ${filename}`);
  }

  console.log(
    `Audio sync complete: ${downloaded} downloaded, ${skipped} already present`,
  );
};
