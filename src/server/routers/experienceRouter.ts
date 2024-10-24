import * as fs from "fs";
import {
  publicProcedure,
  router,
  withDatabaseProcedure,
} from "@/src/server/trpc";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  LOCAL_ASSET_PATH,
} from "@/src/utils/assets";
import { z } from "zod";
import { getS3 } from "@/src/utils/s3";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export const experienceRouter = router({
  listExperiences: withDatabaseProcedure
    .input(
      z.object({
        username: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.username) {
        return await ctx.db.query.experiences
          .findMany({ columns: { name: true } })
          .execute();
      }

      const user = await ctx.db.query.users
        .findFirst({ where: eq(users.username, input.username) })
        .execute();
      if (!user) return [];

      return await ctx.db.query.experiences
        .findMany({
          columns: { name: true },
          with: {
            usersToExperiences: {
              where: eq(users.id, user.id),
            },
          },
        })
        .execute();
    }),

  saveExperience: publicProcedure
    .input(
      z.object({
        experience: z.string(),
        filename: z.string(),
        usingLocalData: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.usingLocalData) {
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

  getExperience: publicProcedure
    .input(
      z.object({
        experienceFilename: z.string(),
        usingLocalData: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      if (input.usingLocalData) {
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
