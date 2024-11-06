import { makeAutoObservable } from "mobx";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { AudioStore } from "@/src/types/AudioStore";
import { Context } from "@/src/types/context";
import { Playlist } from "@/src/types/Playlist";
import { MAX_TIME } from "@/src/utils/time";

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

  get playlistExperienceIds() {
    return this.selectedPlaylist?.orderedExperienceIds;
  }

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

  playPreviousExperience = async () => {
    if (this.rootStore.context === "experienceEditor") {
      this.audioStore.setTimeWithCursor(0);
      return;
    }

    const previousExperienceId = this.getDeltaExperienceId(-1);
    if (previousExperienceId === null) return;

    this.rootStore.pause();
    await this.loadAndPlayExperience(previousExperienceId);
  };

  playNextExperience = async () => {
    if (this.rootStore.context === "experienceEditor") {
      this.audioStore.setTimeWithCursor(MAX_TIME);
      return;
    }

    const nextExperienceId = this.getDeltaExperienceId(1);
    if (nextExperienceId === null) return;

    this.rootStore.pause();
    await this.loadAndPlayExperience(nextExperienceId);
  };

  // e.g. if delta is -1, get the experience ID of the previous experience
  getDeltaExperienceId = (delta: number) => {
    if (!this.playlistExperienceIds?.length) return null;

    let desiredIndex;
    if (!this.rootStore.experienceId) desiredIndex = 0;
    else {
      const currentIndex = this.playlistExperienceIds.indexOf(
        this.rootStore.experienceId
      );
      desiredIndex = currentIndex + delta;

      if (desiredIndex < 0)
        desiredIndex = this.playlistExperienceIds.length - 1;
      if (desiredIndex > this.playlistExperienceIds.length - 1)
        desiredIndex = 0;
    }

    return this.playlistExperienceIds[desiredIndex];
  };
}
