import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { Block } from "../types/Block";
import { LED_COUNTS } from "@/src/utils/size";
import { SelectablePattern } from "@/src/components/SelectablePattern";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { Keyboard } from "@/src/components/Keyboard";
import { action } from "mobx";
import { PreviewCanvas } from "@/src/components/PreviewCanvas";

const PATTERN_PREVIEW_DISPLAY_FACTOR = 1.5;

export const PatternList = observer(function PatternList() {
  const store = useStore();
  const { patterns, selectedPattern } = store;
  const block = useMemo(() => new Block(selectedPattern), [selectedPattern]);

  return (
    <VStack mt={6}>
      <Heading size="md">Pattern List</Heading>
      <Text userSelect="none" fontSize="xs">
        previewing
      </Text>
      <Text userSelect="none" lineHeight={0.5}>
        {selectedPattern.name}
      </Text>
      <Box
        width={`${LED_COUNTS.x * PATTERN_PREVIEW_DISPLAY_FACTOR}px`}
        height={`${LED_COUNTS.y * PATTERN_PREVIEW_DISPLAY_FACTOR}px`}
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
            onInsert={action(() =>
              // TODO: generalize better for multiple layers
              store.selectedLayer
                ? store.selectedLayer.insertCloneOfPattern(p)
                : store.layers[0]?.insertCloneOfPattern(p)
            )}
          />
        ))}
      </VStack>
      <Keyboard />
    </VStack>
  );
});
