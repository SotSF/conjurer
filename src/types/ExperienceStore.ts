import { makeAutoObservable, runInAction } from "mobx";
import { trpcClient } from "@/src/utils/trpc";
import { SerialExperience, EXPERIENCE_VERSION } from "@/src/types/Experience";
import { NO_SONG } from "@/src/types/Song";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  experienceName: string;
  hasSaved: boolean;
  experienceLastSavedAt: number;
  usingLocalData: boolean;
  serialize: () => SerialExperience;
  deserialize: (data: SerialExperience) => void;
}

export class ExperienceStore {
  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  load = async (experienceName: string) => {
    const experience = await trpcClient.experience.getExperience.query({
      experienceName,
      usingLocalData: this.rootStore.usingLocalData,
    });
    if (!experience) {
      this.loadEmptyExperience();
      return;
    }

    this.rootStore.deserialize(experience);
    runInAction(() => {
      this.rootStore.hasSaved = false;
      this.rootStore.experienceLastSavedAt = Date.now();
    });
  };

  loadEmptyExperience = () => {
    this.rootStore.deserialize({
      id: undefined,
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
      pretty ? 2 : 0
    );

  copyToClipboard = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(this.stringifyExperience(true));
  };
}
