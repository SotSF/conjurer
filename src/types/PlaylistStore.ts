import { makeAutoObservable } from "mobx";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { AudioStore } from "@/src/types/AudioStore";
import { Context } from "@/src/types/context";
import { Playlist } from "@/src/types/Playlist";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  context: Context;
  experienceName: string;
  experienceId: number | undefined;
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

  loadAndPlayExperience = async (experienceId: number) => {
    this.rootStore.pause();

    if (this.rootStore.experienceId === experienceId) {
      this.audioStore.setTimeWithCursor(0);
      this.rootStore.play();
      return;
    }

    await this.experienceStore.loadById(experienceId);
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
    if (!this.selectedPlaylist?.orderedExperienceIds.length) return;

    if (!this.rootStore.experienceId) {
      await this.loadAndPlayExperience(
        this.selectedPlaylist.orderedExperienceIds[0]
      );
      return;
    }

    const currentIndex = this.selectedPlaylist?.orderedExperienceIds.indexOf(
      this.rootStore.experienceId
    );
    let nextIndex = currentIndex + 1;

    if (currentIndex < 0) return;
    if (nextIndex > this.selectedPlaylist.orderedExperienceIds.length - 1) {
      if (this.loopingPlaylist) nextIndex = 0;
      else return;
    }

    await this.loadAndPlayExperience(
      this.selectedPlaylist.orderedExperienceIds[nextIndex]
    );
  };
}
