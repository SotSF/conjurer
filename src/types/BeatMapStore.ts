import { makeAutoObservable } from "mobx";
import { BeatMap } from "./BeatMap";
import { trpcClient } from "@/src/utils/trpc";

const removeExtension = (filename: string) =>
  filename.substring(0, filename.lastIndexOf("."));

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  usingLocalAssets: boolean;
  serialize: () => any;
  deserialize: (data: any) => void;
}

// For reference:
// beatMapFilename = `${beatMapName}.json`
export class BeatMapStore {
  beatMap: BeatMap = new BeatMap(120, 0);
  selectedBeatMapName: string | null = null;

  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  load = async (beatMapFilename: string) => {
    const beatMapName = removeExtension(beatMapFilename);
    const { beatMap } = await trpcClient.beatMap.getBeatMap.query({
      beatMapName,
      usingLocalAssets: this.rootStore.usingLocalAssets,
    });
    this.loadFromString(beatMap);
    this.selectedBeatMapName = beatMapName;
  };

  save = async (beatMapName: string, beatMap: string) =>
    trpcClient.beatMap.saveBeatMap.mutate({
      beatMap,
      beatMapName,
      usingLocalAssets: this.rootStore.usingLocalAssets,
    });

  stringifyBeatMap = () => JSON.stringify(this.beatMap.serialize());

  loadFromString = (beatMapString: string) => {
    this.beatMap.deserialize(JSON.parse(beatMapString));
  };

  serialize = () => ({
    beatMap: this.beatMap.serialize(),
  });

  deserialize = (data: any) => {
    this.beatMap.deserialize(data?.beatMap || {});
  };
}
