import * as fs from "fs";
import { publicProcedure, router } from "@/src/server/trpc";
import { GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  BEAT_MAP_ASSET_PREFIX,
  getS3,
  LOCAL_ASSET_PATH,
} from "@/src/utils/assets";
import { z } from "zod";

export const beatMapRouter = router({
  listBeatMaps: publicProcedure
    .input(
      z.object({
        usingLocalAssets: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      let beatMaps: string[] = [];
      if (input.usingLocalAssets) {
        // TODO: implement this
        beatMaps = fs
          .readdirSync(`${LOCAL_ASSET_PATH}${BEAT_MAP_ASSET_PREFIX}`)
          .map((file) => file.toString());
      } else {
        const listObjectsCommand = new ListObjectsCommand({
          Bucket: ASSET_BUCKET_NAME,
          Prefix: BEAT_MAP_ASSET_PREFIX,
        });
        const data = await getS3().send(listObjectsCommand);
        beatMaps =
          data.Contents?.map((object) => object.Key?.split("/")[1] ?? "") ?? [];
      }
      return beatMaps.filter((b) => !!b);
    }),

  // saveExperience: publicProcedure
  //   .input(
  //     z.object({
  //       experience: z.string(),
  //       filename: z.string(),
  //       usingLocalAssets: z.boolean(),
  //     })
  //   )
  //   .mutation(async ({ input }) => {
  //     if (input.usingLocalAssets) {
  //       fs.writeFileSync(
  //         `${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}${input.filename}.json`,
  //         input.experience
  //       );
  //       return;
  //     }

  //     const putObjectCommand = new PutObjectCommand({
  //       Bucket: ASSET_BUCKET_NAME,
  //       Key: `${EXPERIENCE_ASSET_PREFIX}${input.filename}.json`,
  //       Body: input.experience,
  //     });

  //     return getS3().send(putObjectCommand);
  //   }),

  getBeatMap: publicProcedure
    .input(
      z.object({
        beatMapFilename: z.string(),
        usingLocalAssets: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      if (input.usingLocalAssets) {
        // TODO: implement this
        const beatMap = fs
          .readFileSync(
            `${LOCAL_ASSET_PATH}${BEAT_MAP_ASSET_PREFIX}${input.beatMapFilename}.json`
          )
          .toString();
        return { beatMap };
      }

      const getObjectCommand = new GetObjectCommand({
        Bucket: ASSET_BUCKET_NAME,
        Key: `${BEAT_MAP_ASSET_PREFIX}${input.beatMapFilename}.json`,
        ResponseCacheControl: "no-store",
      });

      try {
        const beatMapData = await getS3().send(getObjectCommand);
        const beatMapString = await beatMapData.Body?.transformToString();
        return { beatMap: beatMapString ?? "" };
      } catch (err) {
        console.log(err);
        return { beatMap: "" };
      }
    }),
});
