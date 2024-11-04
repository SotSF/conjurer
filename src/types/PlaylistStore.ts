import { makeAutoObservable } from "mobx";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { AudioStore } from "@/src/types/AudioStore";
import { Context } from "@/src/types/context";
import { Playlist } from "@/src/types/Playlist";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  context: Context;
  experienceName: string;
  play: () => void;
  pause: () => void;
}

export class PlaylistStore {
  autoplay = ["playlistEditor", "viewer"].includes(this.rootStore.context);
  // TODO: implement
  shufflingPlaylist = false;
  loopingPlaylist = false;

  selectedPlaylist: Playlist | null = null;

  constructor(
    readonly rootStore: RootStore,
    readonly audioStore: AudioStore,
    readonly experienceStore: ExperienceStore
  ) {
    makeAutoObservable(this);
  }

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

  playExperienceWhenReady = () =>
    new Promise<void>((resolve) => {
      this.audioStore.wavesurfer?.once("ready", () => {
        this.audioStore.setTimeWithCursor(0);
        this.rootStore.play();
        resolve();
      });
    });

  playNextExperience = async () => {
    // TODO: implement
    // const currentIndex = this.experienceNames.indexOf(
    //   this.rootStore.experienceName
    // );
    // if (currentIndex < 0) return;
    // const nextIndex = currentIndex + 1;
    // if (nextIndex > this.experienceNames.length - 1) return;
    // await this.loadAndPlayExperience(this.experienceNames[nextIndex]);
  };
}
