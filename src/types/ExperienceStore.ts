import { makeAutoObservable, runInAction } from "mobx";
import { trpcClient } from "@/src/utils/trpc";
import { Experience, EXPERIENCE_VERSION } from "@/src/types/Experience";
import { NO_SONG } from "@/src/types/Song";
import type { Store } from "@/src/types/Store";

export class ExperienceStore {
  constructor(readonly store: Store) {
    makeAutoObservable(this);
  }

  loadExperience = (experience: Experience) => {
    this.store.deserialize(experience);
    runInAction(() => {
      this.store.hasSaved = false;
      this.store.experienceLastSavedAt = Date.now();
    });
  };

  load = async (experienceName: string) => {
    const experience = await trpcClient.experience.getExperience.query({
      experienceName,
      usingLocalData: this.store.usingLocalData,
    });
    if (!experience) this.loadEmptyExperience();
    else this.loadExperience(experience);
  };

  loadById = async (experienceId: number) => {
    const experience = await trpcClient.experience.getExperienceById.query({
      experienceId,
      usingLocalData: this.store.usingLocalData,
    });
    if (!experience) this.loadEmptyExperience();
    else this.loadExperience(experience);
  };

  loadEmptyExperience = () => {
    this.store.deserialize({
      id: undefined,
      user: this.store.userStore.me ?? { id: 0, username: "" },
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

  loadFromParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const experience = urlParams.get("experience");
    if (experience) void this.load(experience);
    return !!experience;
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
