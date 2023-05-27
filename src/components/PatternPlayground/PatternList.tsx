import { HStack } from "@chakra-ui/react";
import { SelectablePattern } from "@/src/components/PatternPlayground/SelectablePattern";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { action } from "mobx";

export const PatternList = observer(function PatternList() {
  const store = useStore();
  const { patterns, selectedPattern, uiStore } = store;

  return (
    <HStack height="100%" flexWrap="wrap" gap={1} spacing={0}>
      {patterns.map((p) => (
        <SelectablePattern
          key={p.name}
          pattern={p}
          selected={p === selectedPattern}
          onInsert={action(() => {
            store.selectedLayer.insertCloneOfPattern(p);
            uiStore.patternDrawerOpen = false;
          })}
        />
      ))}
    </HStack>
  );
});
