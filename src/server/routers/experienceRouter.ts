import { publicProcedure, router } from "@/src/server/trpc";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";
import { z } from "zod";

export const experienceRouter = router({
  getExperiences: publicProcedure
    .input(
      z.object({
        user: z.string(),
      })
    )
    .query(async ({ input }) => {
      let experienceFilenames: string[] = [];
      const listObjectsCommand = new ListObjectsCommand({
        Bucket: ASSET_BUCKET_NAME,
        Prefix: EXPERIENCE_ASSET_PREFIX,
      });

      const data = await getS3().send(listObjectsCommand);
      experienceFilenames =
        data.Contents?.map((object) => object.Key?.split("/")[1] ?? "") ?? [];

      return (
        experienceFilenames
          // filter down to only the desired user's experiences
          .filter((e) => e.startsWith(input.user))
          // remove .json extension
          .map((e) => e.replaceAll(".json", "")) ?? []
      );
    }),
  // getExperience: publicProcedure.query(async () => {}),
  // createExperience: publicProcedure.mutation(async () => {}),
  // updateExperience: publicProcedure.mutation(async () => {}),
  // deleteExperience: publicProcedure.mutation(async () => {}),
});
