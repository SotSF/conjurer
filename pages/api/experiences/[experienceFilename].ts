import { EXPERIENCE_ASSET_PREFIX, LOCAL_ASSET_PATH } from "@/src/utils/assets";
import * as fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { experienceFilename } = req.query;
  const experience = fs
    .readFileSync(
      `${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}${experienceFilename}.json`
    )
    .toString();
  res.status(200).json({ experience });
}
