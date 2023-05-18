import { makeAutoObservable } from "mobx";
import initialExperience from "@/src/data/initialExperience.json";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  serialize: () => any;
  deserialize: (data: any) => void;
}

export class ExperienceStore {
  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

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
