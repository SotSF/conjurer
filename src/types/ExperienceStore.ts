import { makeAutoObservable, runInAction } from "mobx";
import { trpcClient } from "@/src/utils/trpc";
import { Experience, EXPERIENCE_VERSION } from "@/src/types/Experience";
import { NO_SONG } from "@/src/types/Song";
import type { Store } from "@/src/types/Store";
import { NextRouter } from "next/router";

export class ExperienceStore {
  private _loadingExperienceName: string | null = null;
  get loadingExperienceName() {
    return this._loadingExperienceName;
  }
  set loadingExperienceName(value: string | null) {
    this._loadingExperienceName = value;
  }

  /** Last document snapshot that was autosaved or loaded; used for dirty checks. */
  lastAutosaveSnapshot: string | null = null;

  constructor(readonly store: Store) {
    makeAutoObservable(this);
  }

  /**
   * Stable key for local autosave history. Prefers experience id when present
   * so renames keep the same bucket; falls back to name for unsaved drafts.
   */
  get autosaveExperienceKey(): string {
    if (this.store.experienceId != null) {
      return `id:${this.store.experienceId}`;
    }
    return `name:${this.store.experienceName || "untitled"}`;
  }

  // Open an experience in the experience editor by experience name
  openExperience = (router: NextRouter, experienceName: string) => {
    router.push(`/experience/${experienceName}`);
  };

  // Open an empty experience in the experience editor
  openEmptyExperience = (router: NextRouter) => {
    router.push("/experience/untitled");
  };

  // This "load" method and subsequent load* methods are used internally to change experiences, and
  // are not meant to be called directly. Instead use openExperience/openEmptyExperience.
  loadExperience = (experience: Experience) => {
    this.store.deserialize(experience);
    runInAction(() => {
      this.store.hasSaved = false;
      this.store.experienceLastSavedAt = Date.now();
      this.captureAutosaveSnapshot();
    });
  };

  loadEmptyExperience = () => {
    this.store.deserialize({
      id: undefined,
      user: this.store.userStore.me ?? { id: -1, username: "" },
      name: "untitled",
      song: NO_SONG,
      status: "inprogress",
      version: EXPERIENCE_VERSION,
      // new experiences start with a single layer; authors add more as needed
      data: { layers: [{ blockMap: {} }] },
      thumbnailURL: "",
    });

    this.store.hasSaved = false;
    this.store.experienceLastSavedAt = 0;
    this.captureAutosaveSnapshot();
  };

  load = async (experienceName: string) => {
    this.loadingExperienceName = experienceName;
    const experience = await trpcClient.experience.getExperience.query({
      experienceName,
      usingLocalData: this.store.usingLocalData,
    });
    if (!experience) this.loadEmptyExperience();
    else this.loadExperience(experience);
    this.loadingExperienceName = null;
  };

  loadById = async (experienceId: number) => {
    const experience = await trpcClient.experience.getExperienceById.query({
      experienceId,
      usingLocalData: this.store.usingLocalData,
    });
    if (!experience) this.loadEmptyExperience();
    else this.loadExperience(experience);
  };

  /**
   * Snapshot of document state for autosave comparison / restore. Does not
   * require authentication (unlike serialize()) so local drafts still work.
   */
  getAutosaveSnapshot = (): string => {
    const experience: Experience = {
      id: this.store.experienceId,
      name: this.store.experienceName,
      user: this.store.userStore.me ??
        this.store.experienceUser ?? { id: -1, username: "" },
      song: this.store.audioStore.selectedSong,
      status: this.store.experienceStatus,
      version: this.store.experienceVersion,
      data: { layers: this.store.layers.map((l) => l.serialize()) },
      thumbnailURL: this.store.experienceThumbnailURL,
    };
    return JSON.stringify(experience, (_, val) =>
      // round numbers to 6 decimal places, which saves space and is probably enough precision
      val?.toFixed ? Number(val.toFixed(6)) : val,
    );
  };

  captureAutosaveSnapshot = () => {
    this.lastAutosaveSnapshot = this.getAutosaveSnapshot();
  };

  isDirtyRelativeToAutosaveSnapshot = (): boolean => {
    if (this.lastAutosaveSnapshot == null) return true;
    return this.getAutosaveSnapshot() !== this.lastAutosaveSnapshot;
  };

  loadFromAutosaveSnapshot = (snapshot: string) => {
    const experience = JSON.parse(snapshot) as Experience;
    this.store.deserialize(experience);
    runInAction(() => {
      this.store.hasSaved = false;
      this.lastAutosaveSnapshot = snapshot;
    });
  };

  stringifyExperience = (pretty: boolean = false): string =>
    JSON.stringify(
      this.store.serialize(),
      (_, val) =>
        // round numbers to 6 decimal places, which saves space and is probably enough precision
        val?.toFixed ? Number(val.toFixed(6)) : val,
      pretty ? 2 : 0,
    );

  copyToClipboard = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(this.stringifyExperience(true));
  };
}
