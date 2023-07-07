import {
  Box,
  Button,
  Grid,
  GridItem,
  VStack,
} from "@chakra-ui/react";
import { PatternList } from "@/src/components/PatternPlayground/PatternList";
import { PreviewCanvas } from "@/src/components/Canvas/PreviewCanvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { Block } from "@/src/types/Block";
import { ParameterControls } from "@/src/components/PatternPlayground/ParameterControls";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { playgroundEffects } from "@/src/effects/effects";
import { action } from "mobx";
import { DisplayModeButtons } from "@/src/components/PatternPlayground/DisplayModeButtons";

const PATTERN_PREVIEW_DISPLAY_SIZE = 600;

export const PatternPlayground = observer(function PatternPlayground() {
  const store = useStore();
  const { uiStore } = store;
  const initIndices : number[] = [];

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

  const [selectedEffectIndices, setSelectedEffectIndices] = useState(initIndices);

  const applyPatternEffects = (patternIndex: number, effectIndices: number[]) => {
    const pattern = patternBlocks[patternIndex];
    pattern.effectBlocks = [];
    effectIndices.forEach((effectIndex, index) => {
      const effect = effectBlocks[effectIndex];
      pattern.effectBlocks[index] = effect;
      effect.parentBlock = pattern;
    });
  }

  const onSelectPatternBlock = action((index: number) => {
    setSelectedPatternIndex(index);
    uiStore.lastPatternIndexSelected = index;

    applyPatternEffects(index, selectedEffectIndices);
  });

  const onSelectEffectBlock = action((index: number, selectedIndices: number[]) => {
    let indices = selectedIndices.concat([]);
    if (index > -1) {
      const i = indices.indexOf(index);
      if (i >= 0) {
        indices.splice(i,1);
        setSelectedEffectIndices(indices);
      }
      else {
        indices = indices.concat(index);
        setSelectedEffectIndices(indices);
      }
    }
    uiStore.lastEffectIndices = indices;
    applyPatternEffects(selectedPatternIndex, indices);
  });

  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializePlayground();
    onSelectPatternBlock(uiStore.lastPatternIndexSelected);
    onSelectEffectBlock(-1, uiStore.lastEffectIndices);
  }, [store, uiStore.lastPatternIndexSelected, uiStore.lastEffectIndices, onSelectPatternBlock, onSelectEffectBlock]);

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
          selectedEffectIndices={selectedEffectIndices}
          onSelectEffectBlock={onSelectEffectBlock}
        />
      </GridItem>
      <GridItem area="controls">
        <ParameterControls block={selectedPatternBlock} />
        {selectedEffectIndices.map((effectIndex, i) => (
            <ParameterControls key={i} block={effectBlocks[effectIndex]} />
        ))}
      </GridItem>
      <GridItem area="preview" position="relative">
        <DisplayModeButtons />
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
