import { makeAutoObservable, runInAction } from "mobx";
import initialPlaylist from "@/src/data/initialPlaylist.json";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { AudioStore } from "@/src/types/AudioStore";
import { Context } from "@/src/types/context";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  context: Context;
  experienceName: string;
  play: () => void;
  pause: () => void;
}

export class PlaylistStore {
  name: string = "";
  experienceNames: string[] = [];

  autoplay = ["playlistEditor", "viewer"].includes(this.rootStore.context);
  shuffle = false;

  constructor(
    readonly rootStore: RootStore,
    readonly audioStore: AudioStore,
    readonly experienceStore: ExperienceStore
  ) {
    makeAutoObservable(this);

    runInAction(() => this.initialize());
  }

  initialize = () => {
    this.name = initialPlaylist.name;
    this.experienceNames = initialPlaylist.experienceNames;
  };

  addExperience = (experienceName: string) => {
    const experienceNames = [...this.experienceNames];
    experienceNames.push(experienceName);
    this.experienceNames = experienceNames;
  };

  reorderExperience = (currentIndex: number, delta: number) => {
    const newIndex = currentIndex + delta;
    if (newIndex < 0 || newIndex > this.experienceNames.length - 1) return;

    const experienceNames = [...this.experienceNames];
    const [removed] = experienceNames.splice(currentIndex, 1);
    experienceNames.splice(newIndex, 0, removed);

    this.experienceNames = experienceNames;
  };

  removeExperience = (index: number) => {
    const experienceNames = [...this.experienceNames];
    experienceNames.splice(index, 1);
    this.experienceNames = experienceNames;
  };

  loadAndPlayExperience = async (experienceName: string) => {
    this.rootStore.pause();

    if (this.rootStore.experienceName === experienceName) {
      this.audioStore.setTimeWithCursor(0);
      this.rootStore.play();
      return;
    }

    await this.experienceStore.load(experienceName);
    await this.playExperienceWhenReady();
  };

  loadFirstExperience = async () => {
    if (this.experienceNames.length === 0) return;

    await this.experienceStore.load(this.experienceNames[0]);
  }

  playExperienceWhenReady = () =>
    new Promise<void>((resolve) => {
      this.audioStore.wavesurfer?.once("ready", () => {
        this.audioStore.setTimeWithCursor(0);
        this.rootStore.play();
        resolve();
      });
    });

  playNextExperience = async () => {
    const currentIndex = this.experienceNames.indexOf(
      this.rootStore.experienceName
    );
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex > this.experienceNames.length - 1) return;

    await this.loadAndPlayExperience(this.experienceNames[nextIndex]);
  };

  copyToClipboard = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(this.stringifyPlaylist());
  };

  stringifyPlaylist = () => JSON.stringify(this.serialize());

  serialize = () => ({
    name: this.name,
    experienceNames: this.experienceNames,
  });
}
