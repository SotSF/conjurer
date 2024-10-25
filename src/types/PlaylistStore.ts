import { makeAutoObservable, runInAction } from "mobx";
import initialPlaylist from "@/src/data/initialPlaylist.json";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { AudioStore } from "@/src/types/AudioStore";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  experienceFilename: string;
  play: () => void;
  pause: () => void;
}

export class PlaylistStore {
  name: string = "";
  experienceFilenames: string[] = [];

  autoplay = false;

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
    this.experienceFilenames = initialPlaylist.experienceFilenames;
  };

  addExperience = (experienceFilename: string) => {
    const experienceFilenames = [...this.experienceFilenames];
    experienceFilenames.push(experienceFilename);
    this.experienceFilenames = experienceFilenames;
  };

  reorderExperience = (currentIndex: number, delta: number) => {
    const newIndex = currentIndex + delta;
    if (newIndex < 0 || newIndex > this.experienceFilenames.length - 1) return;

    const experienceFilenames = [...this.experienceFilenames];
    const [removed] = experienceFilenames.splice(currentIndex, 1);
    experienceFilenames.splice(newIndex, 0, removed);

    this.experienceFilenames = experienceFilenames;
  };

  removeExperience = (index: number) => {
    const experienceFilenames = [...this.experienceFilenames];
    experienceFilenames.splice(index, 1);
    this.experienceFilenames = experienceFilenames;
  };

  loadAndPlayExperience = async (experienceFilename: string) => {
    this.rootStore.pause();

    if (this.rootStore.experienceFilename === experienceFilename) {
      this.audioStore.setTimeWithCursor(0);
      this.rootStore.play();
      return;
    }

    await this.experienceStore.load(experienceFilename);
    await this.playExperienceWhenReady();
  };

  playExperienceWhenReady = () =>
    new Promise<void>((resolve) => {
      this.audioStore.wavesurfer?.once("ready", () => {
        this.audioStore.setTimeWithCursor(0);
        this.rootStore.play();
        resolve();
      });
    });

  playNextExperience = async () => {
    const currentIndex = this.experienceFilenames.indexOf(
      this.rootStore.experienceFilename
    );
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex > this.experienceFilenames.length - 1) return;

    await this.loadAndPlayExperience(this.experienceFilenames[nextIndex]);
  };

  copyToClipboard = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(this.stringifyPlaylist());
  };

  stringifyPlaylist = () => JSON.stringify(this.serialize());

  serialize = () => ({
    name: this.name,
    experienceFilenames: this.experienceFilenames,
  });
}
