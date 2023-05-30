import { HStack } from "@chakra-ui/react";
import { SelectablePattern } from "@/src/components/PatternPlayground/SelectablePattern";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { action } from "mobx";
import { Block } from "@/src/types/Block";

type Props = { selectedBlock: Block };

export const PatternList = observer(function PatternList({
  selectedBlock,
}: Props) {
  const store = useStore();
  const { patterns, uiStore } = store;

  return (
    <HStack height="100%" flexWrap="wrap" gap={1} spacing={0}>
      {patterns.map((p) => (
        <SelectablePattern
          key={p.name}
          pattern={p}
          selected={p === selectedBlock.pattern}
          onInsert={action(() => {
            store.selectedLayer.insertCloneOfBlock(selectedBlock);
            uiStore.patternDrawerOpen = false;
          })}
        />
      ))}
    </HStack>
  );
});
