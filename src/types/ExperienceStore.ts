import { makeAutoObservable, runInAction } from "mobx";
import { trpcClient } from "@/src/utils/trpc";
import { Experience, EXPERIENCE_VERSION } from "@/src/types/Experience";
import { NO_SONG } from "@/src/types/Song";
import type { UserStore } from "@/src/types/UserStore";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  experienceName: string;
  userStore: UserStore;
  hasSaved: boolean;
  experienceLastSavedAt: number;
  usingLocalData: boolean;
  serialize: () => Omit<Experience, "user">;
  deserialize: (data: Experience) => void;
}

export class ExperienceStore {
  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  loadExperience = (experience: Experience) => {
    this.rootStore.deserialize(experience);
    runInAction(() => {
      this.rootStore.hasSaved = false;
      this.rootStore.experienceLastSavedAt = Date.now();
    });
  };

  load = async (experienceName: string) => {
    const experience = await trpcClient.experience.getExperience.query({
      experienceName,
      usingLocalData: this.rootStore.usingLocalData,
    });
    if (!experience) this.loadEmptyExperience();
    else this.loadExperience(experience);
  };

  loadById = async (experienceId: number) => {
    const experience = await trpcClient.experience.getExperienceById.query({
      experienceId,
      usingLocalData: this.rootStore.usingLocalData,
    });
    if (!experience) this.loadEmptyExperience();
    else this.loadExperience(experience);
  };

  loadEmptyExperience = () => {
    this.rootStore.deserialize({
      id: undefined,
      user: this.rootStore.userStore.me ?? { id: 0, username: "" },
      name: "untitled",
      song: NO_SONG,
      status: "inprogress",
      version: EXPERIENCE_VERSION,
      data: { layers: [{ patternBlocks: [] }, { patternBlocks: [] }] },
    });

    this.rootStore.hasSaved = false;
    this.rootStore.experienceLastSavedAt = 0;
  };

  loadFromParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const experience = urlParams.get("experience");
    if (experience) void this.load(experience);
    return !!experience;
  };

  stringifyExperience = (pretty: boolean = false): string =>
    JSON.stringify(
      this.rootStore.serialize(),
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
