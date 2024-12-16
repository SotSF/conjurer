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

  constructor(readonly store: Store) {
    makeAutoObservable(this);
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
      data: { layers: [{ patternBlocks: [] }, { patternBlocks: [] }] },
      thumbnailURL: "",
    });

    this.store.hasSaved = false;
    this.store.experienceLastSavedAt = 0;
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
