import { makeAutoObservable } from "mobx";
import { trpcClient } from "@/src/utils/trpc";
import { extractPartsFromExperienceFilename } from "@/src/utils/experience";
import { SerialExperience, EXPERIENCE_VERSION } from "@/src/types/Experience";
import { NO_SONG } from "@/src/types/Song";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  user: string;
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

  // TODO:
  load = async (experienceFilename: string) => {
    const { experience } = await trpcClient.experience.getExperience.query({
      experienceFilename,
      usingLocalData: this.rootStore.usingLocalData,
    });

    const { user, experienceName } =
      extractPartsFromExperienceFilename(experienceFilename);
    this.rootStore.user = user;
    this.rootStore.experienceName = experienceName;
    this.rootStore.hasSaved = false;
    this.rootStore.experienceLastSavedAt = Date.now();
    this.loadFromString(experience);
  };

  loadFromString = (experienceString: string) => {
    this.rootStore.deserialize(JSON.parse(experienceString));
  };

  loadEmptyExperience = () => {
    this.rootStore.deserialize({
      id: undefined,
      name: `untitled ${Date.now()}`,
      song: NO_SONG,
      status: "inprogress",
      version: EXPERIENCE_VERSION,
      data: { layers: [{ patternBlocks: [] }, { patternBlocks: [] }] },
    });
  };

  // TODO:
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
