import { useStore } from "@/src/types/StoreContext";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import { useEffect, useState } from "react";

export function useExperiences(shouldLoadExperiences: boolean) {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<string[]>([]);

  useEffect(() => {
    if (!shouldLoadExperiences || !store.user) return;

    setLoading(true);

    // get list of objects from s3 bucket using aws sdk
    const listObjectsCommand = new ListObjectsCommand({
      Bucket: ASSET_BUCKET_NAME,
      Prefix: EXPERIENCE_ASSET_PREFIX,
    });
    getS3()
      .send(listObjectsCommand)
      .then((data) => {
        const experienceFilenames =
          // get the names of all experience files
          data.Contents?.map((object) => object.Key?.split("/")[1] ?? "")
            // filter down to only this user's experiences
            .filter((e) => e.startsWith(store.user))
            // remove .json extension
            .map((e) => e.replaceAll(".json", "")) ?? [];
        setExperiences(experienceFilenames);
        setLoading(false);
      });
  }, [shouldLoadExperiences, store.user]);

  return { loading, experiences };
}
