import { makeAutoObservable } from "mobx";
import initialExperience from "@/src/data/initialExperience.json";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  user: string;
  experienceName: string;
  serialize: () => any;
  deserialize: (data: any) => void;
}

export class ExperienceStore {
  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  saveToS3 = () => {
    const experienceFilename = `${this.rootStore.user}-${
      this.rootStore.experienceName || "untitled"
    }`;
    const putObjectCommand = new PutObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${EXPERIENCE_ASSET_PREFIX}${experienceFilename}.json`,
      Body: this.stringifyExperience(),
    });
    return getS3().send(putObjectCommand);
  };

  loadFromS3 = async (experienceFilename: string) => {
    const getObjectCommand = new GetObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${EXPERIENCE_ASSET_PREFIX}${experienceFilename}.json`,
    });
    const experienceData = await getS3().send(getObjectCommand);
    const experienceString = await experienceData.Body?.transformToString();
    if (experienceString) this.loadFromString(experienceString);
  };

  loadFromString = (experienceString: string) => {
    this.rootStore.deserialize(this.parseExperience(experienceString));
  };

  loadInitialExperience = () => {
    // load initial experience from file. if you would like to change this, click the clipboard
    // button in the UI and paste the contents into the data/initialExperience.json file.
    this.rootStore.deserialize(initialExperience);
  };

  stringifyExperience = (): string =>
    JSON.stringify(this.rootStore.serialize(), (_, val) =>
      // round numbers to 4 decimal places, which saves space and is probably enough precision
      val.toFixed ? Number(val.toFixed(4)) : val
    );

  parseExperience = (experience: string): any => JSON.parse(experience);

  copyToClipboard = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(this.stringifyExperience());
  };

  saveToLocalStorage = (key: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, this.stringifyExperience());
  };

  loadFromLocalStorage = (key: string) => {
    if (typeof window === "undefined") return;
    const experience = window.localStorage.getItem(key);
    if (experience)
      this.rootStore.deserialize(this.parseExperience(experience));
  };
}
