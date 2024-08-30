import { makeAutoObservable } from "mobx";
import initialExperience from "@/src/data/initialExperience.json";
import emptyExperience from "@/src/data/emptyExperience.json";

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

  load = (experienceFilename: string) => {
    this.experienceToLoad = experienceFilename;
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

  loadFromParams = () => {
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
