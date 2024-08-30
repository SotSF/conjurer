import * as fs from "fs";
import { publicProcedure, router } from "@/src/server/trpc";
import { z } from "zod";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  AUDIO_ASSET_PREFIX,
  LOCAL_ASSET_PATH,
} from "@/src/utils/assets";
import { getS3 } from "@/src/utils/s3";

export const audioRouter = router({
  listAudioFiles: publicProcedure
    .input(
      z.object({
        usingLocalAssets: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      if (input.usingLocalAssets) {
        return fs
          .readdirSync(`${LOCAL_ASSET_PATH}${AUDIO_ASSET_PREFIX}`)
          .map((file) => file.toString());
      }

      const listObjectsCommand = new ListObjectsCommand({
        Bucket: ASSET_BUCKET_NAME,
        Prefix: AUDIO_ASSET_PREFIX,
      });
      const data = await getS3().send(listObjectsCommand);
      const audioFiles =
        data.Contents?.map((object) => object.Key?.split("/")[1] ?? "") ?? [];
      return audioFiles.filter((audioFile) => !!audioFile);
    }),
});
