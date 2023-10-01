import { useStore } from "@/src/types/StoreContext";
import {
  ASSET_BUCKET_NAME,
  BEAT_MAP_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import { useEffect, useState } from "react";

export function useBeatMaps() {
  const store = useStore();
  const { user, initializedClientSide } = store;
  const [loading, setLoading] = useState(true);
  const [beatMaps, setBeatMaps] = useState<string[]>([]);

  useEffect(() => {
    if (!initializedClientSide) return;

    const fetchBeatMaps = async () => {
      setLoading(true);

      let beatMaps: string[];
      if (store.usingLocalAssets) {
        // TODO: implement this
        const response = await fetch("/api/beatMaps");
        beatMaps = (await response.json()).beatMaps;
      } else {
        const listObjectsCommand = new ListObjectsCommand({
          Bucket: ASSET_BUCKET_NAME,
          Prefix: BEAT_MAP_ASSET_PREFIX,
        });

        const data = await getS3().send(listObjectsCommand);
        beatMaps =
          data.Contents?.map((object) => object.Key?.split("/")[1] ?? "") ?? [];
      }

      setBeatMaps(beatMaps);
      setLoading(false);
    };

    fetchBeatMaps();
  }, [store.usingLocalAssets, initializedClientSide, user]);

  return { loading, beatMaps };
}
