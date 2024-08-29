import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";

export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),

  getAllExperiences: publicProcedure.query(async () => {
    const userPrefix = "ben";
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
        .filter((e) => e.startsWith(userPrefix))
        // remove .json extension
        .map((e) => e.replaceAll(".json", "")) ?? []
    );
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
