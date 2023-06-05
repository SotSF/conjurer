import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";

export const RenderOnTimeChange = observer(function RenderOnTimeChange() {
  const store = useStore();
  const { timer } = store;
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    invalidate();
  }, [timer.globalTime, invalidate]);

  return null;
});
