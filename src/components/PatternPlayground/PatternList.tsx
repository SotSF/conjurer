import { HStack } from "@chakra-ui/react";
import { SelectablePattern } from "@/src/components/PatternPlayground/SelectablePattern";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { Block } from "@/src/types/Block";
import { patterns } from "@/src/patterns/patterns";
import { memo } from "react";

type Props = {
  selectedBlock: Block;
  setSelectedBlockIndex: (index: number) => void;
};

export const PatternList = memo(function PatternList({
  selectedBlock,
  setSelectedBlockIndex,
}: Props) {
  const store = useStore();
  const { uiStore } = store;

  return (
    <HStack height="100%" flexWrap="wrap" gap={1} spacing={0}>
      {patterns.map((p, index) => (
        <SelectablePattern
          key={p.name}
          pattern={p}
          selected={p === selectedBlock.pattern}
          onSelect={() => setSelectedBlockIndex(index)}
          onInsert={action(() => {
            store.selectedLayer.insertCloneOfBlock(selectedBlock);
            uiStore.patternDrawerOpen = false;
          })}
        />
      ))}
    </HStack>
  );
});
