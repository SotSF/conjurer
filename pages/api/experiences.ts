import { EXPERIENCE_ASSET_PREFIX, LOCAL_ASSET_PATH } from "@/src/utils/assets";
import * as fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const experienceFilenames = fs
    .readdirSync(`${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}`)
    .map((file) => file.toString());
  res.status(200).json({ experienceFilenames });
}
