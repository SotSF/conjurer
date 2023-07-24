import { MouseEvent as ReactMouseEvent, useCallback } from "react";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { Variation } from "@/src/types/Variations/Variation";

export function useVariationClick(block: Block, uniformName: string) {
  const store = useStore();

  return useCallback(
    (e: ReactMouseEvent, variation: Variation) => {
      if (
        Array.from(store.selectedBlocksOrVariations).find(
          (blockOrVariation) =>
            blockOrVariation.type === "variation" &&
            blockOrVariation.variation === variation
        )
      ) {
        store.deselectVariation(block, uniformName, variation);
      } else if (e.shiftKey) {
        store.addVariationToSelection(block, uniformName, variation);
      } else {
        store.selectVariation(block, uniformName, variation);
      }

      e.stopPropagation();
    },
    [store, block, uniformName]
  );
}
