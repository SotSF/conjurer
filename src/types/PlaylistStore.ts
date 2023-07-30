import { Timer } from "@/src/types/Timer";
import { makeAutoObservable, runInAction } from "mobx";
import initialPlaylist from "@/src/data/initialPlaylist.json";
import {
  ExperienceStore,
  extractUserFromFilename,
} from "@/src/types/ExperienceStore";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  user: string;
  experienceName: string;
}

export class PlaylistStore {
  name: string = "";
  experienceFilenames: string[] = [];

  constructor(
    readonly rootStore: RootStore,
    readonly timer: Timer,
    readonly experienceStore: ExperienceStore
  ) {
    makeAutoObservable(this);

    runInAction(() => this.initialize());
  }

  playExperience = async (experienceFilename: string) => {
    // this.timer.setTime(0);
    // this.timer.playing = true;

    const user = extractUserFromFilename(experienceFilename);
    if (this.rootStore.user !== user) {
      this.rootStore.user = user;
    }

    await this.experienceStore.load(experienceFilename);
  };

  initialize = () => {
    this.name = initialPlaylist.name;
    this.experienceFilenames = initialPlaylist.experienceFilenames;
  };
}
