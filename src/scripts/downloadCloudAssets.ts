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
  getS3,
} from "../utils/assets";
import * as fs from "fs";

const createDirectory = (path: string) => {
  if (!fs.existsSync(path)) fs.mkdirSync(path);
};

const saveJson = (filename: string, data: any) =>
  fs.writeFileSync(filename, JSON.stringify(data));

const downloadExperiences = async (s3: S3Client) => {
  const listObjectsCommand = new ListObjectsCommand({
    Bucket: ASSET_BUCKET_NAME,
    Prefix: EXPERIENCE_ASSET_PREFIX,
  });
  s3.send(listObjectsCommand).then(async (data) => {
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
  });
};

const downloadAudio = async (s3: S3Client) => {
  const listObjectsCommand = new ListObjectsCommand({
    Bucket: ASSET_BUCKET_NAME,
    Prefix: AUDIO_ASSET_PREFIX,
  });
  s3.send(listObjectsCommand).then(async (data) => {
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
  });
};

const main = async () => {
  console.log("creating asset directories as necessary...");
  createDirectory(LOCAL_ASSET_PATH);
  createDirectory(LOCAL_ASSET_PATH + EXPERIENCE_ASSET_PREFIX);
  createDirectory(LOCAL_ASSET_PATH + AUDIO_ASSET_PREFIX);

  const s3 = getS3();

  console.log("downloading experience assets...");
  await downloadExperiences(s3);

  console.log("downloading audio assets...");
  await downloadAudio(s3);
};

main();
