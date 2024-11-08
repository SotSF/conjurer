import { makeAutoObservable, runInAction } from "mobx";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { AudioStore } from "@/src/types/AudioStore";
import { Context } from "@/src/types/context";
import { Playlist } from "@/src/types/Playlist";
import { MAX_TIME } from "@/src/utils/time";
import { areEqual } from "@/src/utils/array";

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
  shufflingPlaylist = false;
  loopingPlaylist = false;

  selectedPlaylist: Playlist | null = null;

  _cachedPlaylistOrderedExperienceIds: number[] = [];
  _cachedExperienceIdPlayOrder: number[] = [];
  get experienceIdPlayOrder() {
    if (!this.selectedPlaylist) return [];
    if (!this.shufflingPlaylist)
      return this.selectedPlaylist?.orderedExperienceIds;

    // check if the current playlist order is the same as the cached order
    if (
      areEqual(
        this.selectedPlaylist.orderedExperienceIds,
        this._cachedPlaylistOrderedExperienceIds
      )
    ) {
      return this._cachedExperienceIdPlayOrder;
    }

    // current playlist order and cached order are different, so update the cache
    this._cachedPlaylistOrderedExperienceIds =
      this.selectedPlaylist.orderedExperienceIds.slice();
    this._cachedExperienceIdPlayOrder =
      this.selectedPlaylist.orderedExperienceIds.slice();

    console.log("shuffling");
    // shuffle the play order
    this._cachedExperienceIdPlayOrder.sort(() => Math.random() - 0.5);
    return this._cachedExperienceIdPlayOrder;
  }

  constructor(
    readonly rootStore: RootStore,
    readonly audioStore: AudioStore,
    readonly experienceStore: ExperienceStore
  ) {
    makeAutoObservable(this, {
      _cachedPlaylistOrderedExperienceIds: false,
      _cachedExperienceIdPlayOrder: false,
    });
  }

  loadAndPlayExperience = async (experienceId: number) => {
    this.rootStore.pause();

    if (this.rootStore.experienceId === experienceId) {
      this.audioStore.setTimeWithCursor(0);
      this.rootStore.play();
      return;
    }

    await this.experienceStore.loadById(experienceId);
    runInAction(() => {
      this.audioStore.audioState = "playing";
    });
  };

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
    if (!this.experienceIdPlayOrder?.length) return null;

    let desiredIndex;
    if (!this.rootStore.experienceId) desiredIndex = 0;
    else {
      const currentIndex = this.experienceIdPlayOrder.indexOf(
        this.rootStore.experienceId
      );
      desiredIndex = currentIndex + delta;

      if (desiredIndex < 0)
        desiredIndex = this.experienceIdPlayOrder.length - 1;
      if (desiredIndex > this.experienceIdPlayOrder.length - 1)
        desiredIndex = 0;
    }

    return this.experienceIdPlayOrder[desiredIndex];
  };
}
