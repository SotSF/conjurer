import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { useEffect, useRef } from "react";
import { runInAction } from "mobx";
import { BeatMapperView } from "@/src/components/BeatMapperView";

export const BeatMapperPage = observer(function BeatMapperPage() {
  const store = useStore();
  const { beatMapStore, playlistStore, uiStore } = store;

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      runInAction(() => {
        // TODO: un-break
        // playlistStore.experienceNames = ["joe-night-jar"];
      });
      store.initializeClientSide();
    }
  }, [store, playlistStore, uiStore]);

  return <BeatMapperView key={beatMapStore.selectedBeatMapName} />;
});
