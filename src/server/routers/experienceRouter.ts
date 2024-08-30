import * as fs from "fs";
import { publicProcedure, router } from "@/src/server/trpc";
import {
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
  LOCAL_ASSET_PATH,
} from "@/src/utils/assets";
import { z } from "zod";

export const experienceRouter = router({
  listExperiences: publicProcedure
    .input(
      z.object({
        usingLocalAssets: z.boolean(),
        user: z.string(),
      })
    )
    .query(async ({ input }) => {
      let experienceFilenames: string[] = [];
      if (input.usingLocalAssets) {
        experienceFilenames = fs
          .readdirSync(`${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}`)
          .map((file) => file.toString());
      } else {
        const listObjectsCommand = new ListObjectsCommand({
          Bucket: ASSET_BUCKET_NAME,
          Prefix: EXPERIENCE_ASSET_PREFIX,
        });
        const data = await getS3().send(listObjectsCommand);
        experienceFilenames =
          data.Contents?.map((object) => object.Key?.split("/")[1] ?? "") ?? [];
      }

      return (
        experienceFilenames
          // filter down to only the desired user's experiences
          .filter((e) => e.startsWith(input.user))
          // remove .json extension
          .map((e) => e.replaceAll(".json", "")) ?? []
      );
    }),

  saveExperience: publicProcedure
    .input(
      z.object({
        experience: z.string(),
        filename: z.string(),
        usingLocalAssets: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.usingLocalAssets) {
        fs.writeFileSync(
          `${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}${input.filename}.json`,
          input.experience
        );
        return;
      }

      const putObjectCommand = new PutObjectCommand({
        Bucket: ASSET_BUCKET_NAME,
        Key: `${EXPERIENCE_ASSET_PREFIX}${input.filename}.json`,
        Body: input.experience,
      });

      return getS3().send(putObjectCommand);
    }),

  loadExperience: publicProcedure
    .input(
      z.object({
        experienceFilename: z.string(),
        usingLocalAssets: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      if (input.usingLocalAssets) {
        const experience = fs
          .readFileSync(
            `${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}${input.experienceFilename}.json`
          )
          .toString();
        return { experience };
      }

      const getObjectCommand = new GetObjectCommand({
        Bucket: ASSET_BUCKET_NAME,
        Key: `${EXPERIENCE_ASSET_PREFIX}${input.experienceFilename}.json`,
        ResponseCacheControl: "no-store",
      });

      try {
        const experienceData = await getS3().send(getObjectCommand);
        const experienceString = await experienceData.Body?.transformToString();
        return { experience: experienceString ?? "" };
      } catch (err) {
        console.log(err);
        return { experience: "" };
      }
    }),
});
