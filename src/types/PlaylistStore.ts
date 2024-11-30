import { makeAutoObservable, runInAction } from "mobx";
import { Playlist } from "@/src/types/Playlist";
import { MAX_TIME } from "@/src/utils/time";
import { areEqual } from "@/src/utils/array";
import type { Store } from "@/src/types/Store";

export class PlaylistStore {
  autoplay = ["playlistEditor", "viewer"].includes(this.store.context);
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
        this._cachedPlaylistOrderedExperienceIds,
      )
    ) {
      return this._cachedExperienceIdPlayOrder;
    }

    // current playlist order and cached order are different, so update the cache
    this._cachedPlaylistOrderedExperienceIds =
      this.selectedPlaylist.orderedExperienceIds.slice();
    this._cachedExperienceIdPlayOrder =
      this.selectedPlaylist.orderedExperienceIds.slice();

    // shuffle the play order
    this._cachedExperienceIdPlayOrder.sort(() => Math.random() - 0.5);
    return this._cachedExperienceIdPlayOrder;
  }

  constructor(readonly store: Store) {
    makeAutoObservable(this, {
      _cachedPlaylistOrderedExperienceIds: false,
      _cachedExperienceIdPlayOrder: false,
    });
  }

  loadAndPlayExperience = async (experienceId: number) => {
    this.store.pause();

    if (this.store.experienceId === experienceId) {
      this.store.audioStore.setTimeWithCursor(0);
      this.store.play();
      return;
    }

    await this.store.experienceStore.loadById(experienceId);

    this.store.audioStore.setTimeWithCursor(0);
    this.store.play();
  };

  playPreviousExperience = async () => {
    if (this.store.context === "experienceEditor") {
      this.store.audioStore.setTimeWithCursor(0);
      return;
    }

    const previousExperienceId = this.getDeltaExperienceId(-1);
    if (previousExperienceId === null) return;

    this.store.pause();
    await this.loadAndPlayExperience(previousExperienceId);
  };

  playNextExperience = async () => {
    if (this.store.context === "experienceEditor") {
      this.store.audioStore.setTimeWithCursor(MAX_TIME);
      return;
    }

    const nextExperienceId = this.getDeltaExperienceId(1);
    if (nextExperienceId === null) return;

    this.store.pause();
    await this.loadAndPlayExperience(nextExperienceId);
  };

  // e.g. if delta is -1, get the experience ID of the previous experience
  getDeltaExperienceId = (delta: number) => {
    if (!this.experienceIdPlayOrder?.length) return null;

    let desiredIndex;
    if (!this.store.experienceId) desiredIndex = 0;
    else {
      const currentIndex = this.experienceIdPlayOrder.indexOf(
        this.store.experienceId,
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
