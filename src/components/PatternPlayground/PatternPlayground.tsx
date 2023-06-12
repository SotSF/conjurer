import { Box, Grid, GridItem, VStack } from "@chakra-ui/react";
import { PatternList } from "@/src/components/PatternPlayground/PatternList";
import { PreviewCanvas } from "@/src/components/PatternPlayground/PreviewCanvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { Block } from "@/src/types/Block";
import { ParameterControls } from "@/src/components/PatternPlayground/ParameterControls";
import { patterns } from "@/src/patterns/patterns";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";

const PATTERN_PREVIEW_DISPLAY_SIZE = 600;

export const PatternPlayground = observer(function PatternPlayground() {
  const store = useStore();
  const { uiStore } = store;

  const playgroundBlocks = useMemo(
    () => patterns.map((pattern) => new Block(pattern), []),
    []
  );
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(
    uiStore.lastPatternIndexSelected
  );
  const selectedBlock =
    playgroundBlocks[selectedBlockIndex] ?? playgroundBlocks[0];

  const onSelectBlock = (index: number) => {
    setSelectedBlockIndex(index);
    uiStore.lastPatternIndexSelected = index;
  };

  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializePlayground();
    setSelectedBlockIndex(uiStore.lastPatternIndexSelected);
  }, [store, uiStore.lastPatternIndexSelected]);

  return (
    <Grid
      height="100%"
      templateAreas={`"patterns patterns"
                      "controls preview"`}
      gridTemplateColumns="50% 50%"
      gridTemplateRows="auto 1fr"
    >
      <GridItem area="patterns">
        <PatternList
          selectedBlock={selectedBlock}
          onSelectBlock={onSelectBlock}
        />
      </GridItem>
      <GridItem area="controls">
        <ParameterControls block={selectedBlock} />
      </GridItem>
      <GridItem area="preview">
        <VStack
          position="sticky"
          top={0}
          height="70vh"
          justify="center"
          alignItems="center"
        >
          <Box
            width={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
            height={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
          >
            <PreviewCanvas block={selectedBlock} />
          </Box>
        </VStack>
      </GridItem>
    </Grid>
  );
});
