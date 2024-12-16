import { makeAutoObservable } from "mobx";
import { BeatMap } from "./BeatMap";
import { trpcClient } from "@/src/utils/trpc";
import type { Store } from "@/src/types/Store";

const removeExtension = (filename: string) =>
  filename.substring(0, filename.lastIndexOf("."));

// For reference:
// beatMapFilename = `${beatMapName}.json`
export class BeatMapStore {
  beatMap: BeatMap = new BeatMap(120, 0);
  selectedBeatMapName: string | null = null;

  constructor(readonly store: Store) {
    makeAutoObservable(this);
  }

  load = async (beatMapFilename: string) => {
    const beatMapName = removeExtension(beatMapFilename);
    const { beatMap } = await trpcClient.beatMap.getBeatMap.query({
      beatMapName,
      usingLocalData: this.store.usingLocalData,
    });
    this.loadFromString(beatMap);
    this.selectedBeatMapName = beatMapName;
  };

  save = async (beatMapName: string, beatMap: string) =>
    trpcClient.beatMap.saveBeatMap.mutate({
      beatMap,
      beatMapName,
      usingLocalData: this.store.usingLocalData,
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
