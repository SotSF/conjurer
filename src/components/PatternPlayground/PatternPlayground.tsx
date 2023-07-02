import { FaDotCircle } from "react-icons/fa";
import { TbRectangleFilled } from "react-icons/tb";
import {
  Box,
  Button,
  Grid,
  GridItem,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { PatternList } from "@/src/components/PatternPlayground/PatternList";
import { PreviewCanvas } from "@/src/components/PatternPlayground/PreviewCanvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { Block } from "@/src/types/Block";
import { ParameterControls } from "@/src/components/PatternPlayground/ParameterControls";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { playgroundEffects } from "@/src/effects/effects";
import { action } from "mobx";

const PATTERN_PREVIEW_DISPLAY_SIZE = 600;

export const PatternPlayground = observer(function PatternPlayground() {
  const store = useStore();
  const { uiStore } = store;

  // TODO: in dire need of refactoring
  const patternBlocks = useMemo(
    () => playgroundPatterns.map((pattern) => new Block(pattern), []),
    []
  );
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(
    uiStore.lastPatternIndexSelected
  );
  const selectedPatternBlock =
    patternBlocks[selectedPatternIndex] ?? patternBlocks[0];

  const effectBlocks = useMemo(
    () => playgroundEffects.map((effect) => new Block(effect)),
    []
  );
  const [selectedEffectIndex, setSelectedEffectIndex] = useState(
    uiStore.lastEffectIndexSelected
  );
  const selectedEffectBlock = effectBlocks[selectedEffectIndex];

  const onSelectPatternEffect = action(
    (patternIndex: number, effectIndex: number) => {
      setSelectedPatternIndex(patternIndex);
      setSelectedEffectIndex(effectIndex);
      uiStore.lastPatternIndexSelected = patternIndex;
      uiStore.lastEffectIndexSelected = effectIndex;
      const newSelectedPatternBlock = patternBlocks[patternIndex];
      const newSelectedEffectBlock = effectBlocks[effectIndex];

      if (!newSelectedEffectBlock) {
        newSelectedPatternBlock.effectBlocks = [];
        return;
      }

      newSelectedPatternBlock.effectBlocks[0] = newSelectedEffectBlock;
      newSelectedEffectBlock.parentBlock = newSelectedPatternBlock;
    }
  );

  const onSelectPatternBlock = action((index: number) =>
    onSelectPatternEffect(index, selectedEffectIndex)
  );

  const onSelectEffectBlock = action((index: number) =>
    onSelectPatternEffect(selectedPatternIndex, index)
  );

  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializePlayground();
    onSelectPatternEffect(
      uiStore.lastPatternIndexSelected,
      uiStore.lastEffectIndexSelected
    );
  }, [store, uiStore.lastPatternIndexSelected, uiStore.lastEffectIndexSelected, onSelectPatternEffect]);

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
          selectedPatternBlock={selectedPatternBlock}
          onSelectPatternBlock={onSelectPatternBlock}
          selectedEffectBlock={selectedEffectBlock}
          onSelectEffectBlock={onSelectEffectBlock}
        />
      </GridItem>
      <GridItem area="controls">
        <ParameterControls block={selectedPatternBlock} />
        {selectedEffectBlock && (
          <ParameterControls block={selectedEffectBlock} />
        )}
      </GridItem>
      <GridItem area="preview" position="relative">
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
            <PreviewCanvas block={selectedPatternBlock} />
          </Box>
        </VStack>
        <Button
          position="absolute"
          top={15}
          right={2}
          aria-label="Toggle canopy view"
          title="Toggle canopy view"
          height={6}
          leftIcon={
            uiStore.displayMode === "canopySpace" ? (
              <TbRectangleFilled size={17} />
            ) : (
              <FaDotCircle size={17} />
            )
          }
          onClick={uiStore.toggleDisplayMode}
        >
          {uiStore.displayMode === "canopySpace" ? "Canopy space" : "Canopy"}
        </Button>
        {uiStore.patternDrawerOpen && (
          <Button
            position="absolute"
            top={12}
            right={2}
            colorScheme="teal"
            onClick={action(() => {
              store.selectedLayer.insertCloneOfBlock(selectedPatternBlock);
              uiStore.patternDrawerOpen = false;
            })}
          >
            Insert
          </Button>
        )}
      </GridItem>
    </Grid>
  );
});
