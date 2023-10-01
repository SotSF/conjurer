import { makeAutoObservable } from "mobx";
import { BeatMap } from "./BeatMap";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  serialize: () => any;
  deserialize: (data: any) => void;
}

export class BeatMapStore {
  beatMap: BeatMap = new BeatMap(120, 0);
  selectedBeatMapName: string | null = null;

  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  serialize = () => ({
    beatMap: this.beatMap.serialize(),
  });

  deserialize = (data: any) => {
    this.beatMap.deserialize(data.beatMap || {});
  };
}
