import { useEffect, useRef } from "react";
import { PatternPlayground } from "@/src/components/PatternPlayground/PatternPlayground";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";

export const PlaygroundPage = observer(function PlaygroundPage() {
  const store = useStore();

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    store.initialize();
  }, [store]);

  return store.initialized && <PatternPlayground />;
});
