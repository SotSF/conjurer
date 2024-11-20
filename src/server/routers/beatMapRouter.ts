import { publicProcedure, router } from "@/src/server/trpc";
import { z } from "zod";

export const beatMapRouter = router({
  listBeatMaps: publicProcedure
    .input(
      z.object({
        usingLocalData: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      // let beatMaps: string[] = [];
      // if (input.usingLocalData) {
      //   // TODO: implement this
      // } else {
      //   const listObjectsCommand = new ListObjectsCommand({
      //     Bucket: ASSET_BUCKET_NAME,
      //     Prefix: BEAT_MAP_ASSET_PREFIX,
      //   });
      //   const data = await getS3().send(listObjectsCommand);
      //   beatMaps =
      //     data.Contents?.map((object) => object.Key?.split("/")[1] ?? "") ?? [];
      // }
      // return beatMaps.filter((b) => !!b);

      return [];
    }),

  getBeatMap: publicProcedure
    .input(
      z.object({
        beatMapName: z.string(),
        usingLocalData: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      // if (input.usingLocalData) {
      //   // TODO: implement this
      // }

      // const getObjectCommand = new GetObjectCommand({
      //   Bucket: ASSET_BUCKET_NAME,
      //   Key: `${BEAT_MAP_ASSET_PREFIX}${input.beatMapName}.json`,
      //   ResponseCacheControl: "no-store",
      // });

      // try {
      //   const beatMapData = await getS3().send(getObjectCommand);
      //   const beatMapString = await beatMapData.Body?.transformToString();
      //   return { beatMap: beatMapString ?? "" };
      // } catch (err) {
      //   console.log(err);
      //   return { beatMap: "" };
      // }

      return { beatMap: "" };
    }),

  saveBeatMap: publicProcedure
    .input(
      z.object({
        beatMap: z.string(),
        beatMapName: z.string(),
        usingLocalData: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      // if (input.usingLocalData) {
      //   // TODO: implement this
      // }
      // const putObjectCommand = new PutObjectCommand({
      //   Bucket: ASSET_BUCKET_NAME,
      //   Key: `${BEAT_MAP_ASSET_PREFIX}${input.beatMapName}.json`,
      //   Body: input.beatMap,
      // });
      // return getS3().send(putObjectCommand);
    }),
});
