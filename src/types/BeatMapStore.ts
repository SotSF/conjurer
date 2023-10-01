import { makeAutoObservable } from "mobx";
import { BeatMap } from "./BeatMap";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  BEAT_MAP_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";

const removeExtension = (filename: string) =>
  filename.substring(0, filename.lastIndexOf("."));

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  usingLocalAssets: boolean;
  serialize: () => any;
  deserialize: (data: any) => void;
}

export class BeatMapStore {
  beatMap: BeatMap = new BeatMap(120, 0);
  selectedBeatMapName: string | null = null;

  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  load = async (beatMapFilename: string) => {
    if (this.rootStore.usingLocalAssets) {
      // TODO: implement this
      const response = await fetch(`/api/beat-maps/${beatMapFilename}`);
      const { beatMap } = await response.json();
      // this.loadFromString(beatMap);
      this.selectedBeatMapName = removeExtension(beatMapFilename);
      return;
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${BEAT_MAP_ASSET_PREFIX}${beatMapFilename}`,
      ResponseCacheControl: "no-store",
    });

    try {
      const beatMapData = await getS3().send(getObjectCommand);
      const beatMapString = await beatMapData.Body?.transformToString();
      if (beatMapString) {
        this.loadFromString(beatMapString);
        console.log(beatMapString);
        this.selectedBeatMapName = removeExtension(beatMapFilename);
        console.log(this.selectedBeatMapName);
        console.log(this.beatMap.tempo);
      }
    } catch (err) {
      console.log(err);
    }
  };

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
