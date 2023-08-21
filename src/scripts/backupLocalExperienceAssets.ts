import { backupExperiences } from "../scripts/assetManagement";

const main = async () => {
  console.log("backing up experience assets...");
  await backupExperiences();
};

main();
