import { makeAutoObservable } from "mobx";
import initialExperience from "@/src/data/initialExperience.json";
import emptyExperience from "@/src/data/emptyExperience.json";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";

// Experience filename format: <user>-<experienceName>.json
export const extractUserFromFilename = (filename: string): string => {
  const parts = filename.split("-");
  if (parts.length < 2) return "";
  return parts[0];
};
export const extractExperienceNameFromFileName = (filename: string): string => {
  const parts = filename.split("-");
  if (parts.length < 2) return "untitled";
  return parts.slice(1).join("-");
};

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  user: string;
  experienceName: string;
  experienceLastSavedAt: number;
  usingLocalAssets: boolean;
  serialize: () => any;
  deserialize: (data: any) => void;
}

export class ExperienceStore {
  experienceToLoad = "";

  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  load = async (experienceFilename: string) => {
    this.rootStore.user = extractUserFromFilename(experienceFilename);
    this.rootStore.experienceName =
      extractExperienceNameFromFileName(experienceFilename);
    this.rootStore.experienceLastSavedAt = Date.now();

    if (this.rootStore.usingLocalAssets) {
      const response = await fetch(`/api/experiences/${experienceFilename}`);
      const { experience } = await response.json();
      this.loadFromString(experience);
      return;
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${EXPERIENCE_ASSET_PREFIX}${experienceFilename}.json`,
      ResponseCacheControl: "no-store",
    });

    try {
      const experienceData = await getS3().send(getObjectCommand);
      const experienceString = await experienceData.Body?.transformToString();
      if (experienceString) this.loadFromString(experienceString);
    } catch (err) {
      console.log(err);
      this.loadEmptyExperience();
    }
  };

  loadFromString = (experienceString: string) => {
    this.rootStore.deserialize(JSON.parse(experienceString));
  };

  loadEmptyExperience = () => {
    this.rootStore.deserialize(emptyExperience);
  };

  loadInitialExperience = () => {
    // load initial experience from file. if you would like to change this, click the clipboard
    // button in the UI and paste the contents into the data/initialExperience.json file.
    this.rootStore.deserialize(initialExperience);
  };

  loadExperienceFromParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const experience = urlParams.get("experience");
    if (experience) void this.load(experience);
    return !!experience;
  };

  stringifyExperience = (): string =>
    JSON.stringify(this.rootStore.serialize(), (_, val) =>
      // round numbers to 6 decimal places, which saves space and is probably enough precision
      val?.toFixed ? Number(val.toFixed(6)) : val
    );

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
    if (experience) this.loadFromString(experience);
  };
}
