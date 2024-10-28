import { getS3 } from "../utils/s3";
import { downloadAudio, setupAssetDirectories } from "./assetManagement";

const main = async () => {
  console.log("creating asset directories as necessary...");
  setupAssetDirectories();

  const s3 = getS3();

  console.log("downloading audio assets...");
  await downloadAudio(s3);
};

main();
