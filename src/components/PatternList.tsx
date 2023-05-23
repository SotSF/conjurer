import { Box, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { Block } from "../types/Block";
import { SelectablePattern } from "@/src/components/SelectablePattern";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { action } from "mobx";
import { PreviewCanvas } from "@/src/components/PreviewCanvas";

const PATTERN_PREVIEW_DISPLAY_SIZE = 300;

export const PatternList = observer(function PatternList() {
  const store = useStore();
  const { patterns, selectedPattern, uiStore } = store;
  const block = useMemo(() => new Block(selectedPattern), [selectedPattern]);

  return (
    <VStack>
      <Text userSelect="none" fontSize="xs">
        previewing
      </Text>
      <Text userSelect="none" lineHeight={0.5}>
        {selectedPattern.name}
      </Text>
      <Box
        width={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
        height={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
      >
        <PreviewCanvas block={block} />
      </Box>

      <Text userSelect="none" fontSize="xs">
        double click to insert
      </Text>

      <VStack>
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
      </VStack>
    </VStack>
  );
});
