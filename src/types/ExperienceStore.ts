import { makeAutoObservable } from "mobx";
import initialExperience from "@/src/data/initialExperience.json";
import {
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";

// Filename format: <user>-<experienceName>.json
const extractExperienceNameFromFileName = (filename: string): string => {
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
  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  fetchAvailableExperiences = async (userPrefix: string) => {
    let experienceFilenames: string[] = [];
    if (this.rootStore.usingLocalAssets) {
      const response = await fetch("/api/experiences");
      experienceFilenames = (await response.json()).experienceFilenames;
    } else {
      const listObjectsCommand = new ListObjectsCommand({
        Bucket: ASSET_BUCKET_NAME,
        Prefix: EXPERIENCE_ASSET_PREFIX,
      });

      const data = await getS3().send(listObjectsCommand);
      experienceFilenames =
        data.Contents?.map((object) => object.Key?.split("/")[1] ?? "") ?? [];
    }

    return (
      experienceFilenames
        // filter down to only the desired user's experiences
        .filter((e) => e.startsWith(userPrefix))
        // remove .json extension
        .map((e) => e.replaceAll(".json", "")) ?? []
    );
  };

  save = () => {
    this.rootStore.experienceLastSavedAt = Date.now();
    const experienceFilename = `${this.rootStore.user}-${
      this.rootStore.experienceName || "untitled"
    }`;

    if (this.rootStore.usingLocalAssets) {
      fetch(`/api/experiences/${experienceFilename}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ experience: this.stringifyExperience() }),
      });
      return;
    }

    const putObjectCommand = new PutObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${EXPERIENCE_ASSET_PREFIX}${experienceFilename}.json`,
      Body: this.stringifyExperience(),
    });

    return getS3().send(putObjectCommand);
  };

  load = async (experienceFilename: string) => {
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
      val?.toFixed ? Number(val.toFixed(4)) : val
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
