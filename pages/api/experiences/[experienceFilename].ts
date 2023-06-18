import { EXPERIENCE_ASSET_PREFIX, LOCAL_ASSET_PATH } from "@/src/utils/assets";
import * as fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { experienceFilename } = req.query;
  const experienceFilepath = `${LOCAL_ASSET_PATH}${EXPERIENCE_ASSET_PREFIX}${experienceFilename}.json`;
  if (req.method === "GET") {
    const experience = fs.readFileSync(experienceFilepath).toString();
    res.status(200).json({ experience });
  } else if (req.method === "PUT") {
    const { experience } = req.body;
    fs.writeFileSync(experienceFilepath, experience);
    res.status(200).json({ message: "Experience saved" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
