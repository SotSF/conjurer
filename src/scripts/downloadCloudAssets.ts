import { getS3 } from "../utils/assets";
import {
  backupExperiences,
  downloadAudio,
  downloadExperiences,
  setupAssetDirectories,
} from "../scripts/assetManagement";

const main = async () => {
  console.log("creating asset directories as necessary...");
  setupAssetDirectories();

  const s3 = getS3();

  console.log("downloading experience assets...");
  await downloadExperiences(s3);

  console.log("backing up experience assets...");
  await backupExperiences();

  console.log("downloading audio assets...");
  await downloadAudio(s3);
};

main();
