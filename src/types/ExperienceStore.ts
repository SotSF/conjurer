import { makeAutoObservable } from "mobx";
import initialExperience from "@/src/data/initialExperience.json";

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

  copyToClipboard = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(
      JSON.stringify(this.rootStore.serialize(), (key, val) =>
        val.toFixed ? Number(val.toFixed(4)) : val
      )
    );
  };

  saveToLocalStorage = (key: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      key,
      JSON.stringify(this.rootStore.serialize(), (key, val) =>
        val.toFixed ? Number(val.toFixed(4)) : val
      )
    );
  };

  loadFromLocalStorage = (key: string) => {
    if (typeof window === "undefined") return;
    const arrangement = window.localStorage.getItem(key);
    if (arrangement) {
      this.rootStore.deserialize(JSON.parse(arrangement));
    }
  };
}
