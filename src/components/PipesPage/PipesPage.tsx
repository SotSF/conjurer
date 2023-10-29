import { useEffect, useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { PipesViewer } from "@/src/components/PipesPage/PipesViewer";

export const PipesPage = observer(function PipesPage() {
  const store = useStore();

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    store.initializeClientSide();
  }, [store]);

  return store.initializedClientSide && <PipesViewer />;
});
