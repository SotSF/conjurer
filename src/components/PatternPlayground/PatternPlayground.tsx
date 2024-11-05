import styles from "@/styles/PatternPlayground.module.css";
import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { PatternList } from "@/src/components/PatternPlayground/PatternList";
import { PreviewCanvas } from "@/src/components/Canvas/PreviewCanvas";
import { useCallback, useEffect, useRef } from "react";
import { ParameterControls } from "@/src/components/PatternPlayground/ParameterControls";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { action, runInAction } from "mobx";
import { DisplayModeButtons } from "@/src/components/PatternPlayground/DisplayModeButtons";
import { SendDataButton } from "@/src/components/SendDataButton";
import { PresetsList } from "@/src/components/PatternPlayground/PresetsList";
// import { RecordCanvasControls } from "@/src/components/PatternPlayground/RecordCanvasControls";

const PATTERN_PREVIEW_DISPLAY_SIZE = 600;

export const PatternPlayground = observer(function PatternPlayground() {
  const store = useStore();
  const { uiStore, playgroundStore, context } = store;
  const {
    patternBlocks,
    effectBlocks,
    selectedPatternIndex,
    selectedEffectIndices,
    lastPatternIndexSelected,
    lastEffectIndices,
    selectedPatternBlock,
  } = playgroundStore;

  const applyPatternEffects = useCallback(
    (patternIndex: number, effectIndices: number[]) => {
      const pattern = patternBlocks[patternIndex] ?? patternBlocks[0];
      runInAction(() => {
        pattern.effectBlocks = [];
        effectIndices.forEach((effectIndex, index) => {
          const effect = effectBlocks[effectIndex];
          pattern.effectBlocks[index] = effect;
          effect.parentBlock = pattern;
        });
      });
    },
    [effectBlocks, patternBlocks]
  );

  const onSelectPatternBlock = action((index: number) => {
    playgroundStore.selectedPatternIndex = index;
    playgroundStore.lastPatternIndexSelected = index;

    applyPatternEffects(index, selectedEffectIndices);
  });

  const onSelectEffectBlock = action((index: number) => {
    let newSelectedEffectIndices = [...selectedEffectIndices];
    const i = newSelectedEffectIndices.indexOf(index);
    if (i >= 0) {
      // index found, remove it
      newSelectedEffectIndices.splice(i, 1);
      playgroundStore.selectedEffectIndices = newSelectedEffectIndices;
    } else {
      // index not found, add it
      newSelectedEffectIndices = newSelectedEffectIndices.concat(index);
      playgroundStore.selectedEffectIndices = newSelectedEffectIndices;
    }
    playgroundStore.lastEffectIndices = newSelectedEffectIndices;
    applyPatternEffects(selectedPatternIndex, newSelectedEffectIndices);
  });

  useEffect(() => {
    applyPatternEffects(
      playgroundStore.selectedPatternIndex,
      playgroundStore.selectedEffectIndices
    );
    playgroundStore.sendControllerUpdateMessage();
  }, [context, selectedPatternBlock, applyPatternEffects, playgroundStore, playgroundStore.selectedEffectIndices, playgroundStore.selectedPatternIndex]);

  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializeClientSide();
    applyPatternEffects(lastPatternIndexSelected, lastEffectIndices);
  }, [store, lastPatternIndexSelected, lastEffectIndices, playgroundStore.lastEffectIndices, onSelectPatternBlock, applyPatternEffects]);

  return (
    <Grid className={styles.grid} height="100%">
      <GridItem area="patterns" mb={3}>
        <PresetsList />
        <PatternList
          selectedPatternBlock={selectedPatternBlock}
          onSelectPatternBlock={onSelectPatternBlock}
          selectedEffectIndices={selectedEffectIndices}
          onSelectEffectBlock={onSelectEffectBlock}
        />
      </GridItem>
      <GridItem className={styles.controls} area="controls">
        <VStack p={2} height="100%" overflowY="scroll">
          <ParameterControls
            key={selectedPatternBlock.id}
            block={selectedPatternBlock}
          />
          {selectedEffectIndices.map((effectIndex, i) => (
            <ParameterControls
              key={`${effectBlocks[effectIndex].id}-${i}`}
              block={effectBlocks[effectIndex]}
            />
          ))}
        </VStack>
      </GridItem>
      <GridItem area="preview" position="relative">
        {context === "controller" && (
          <VStack width="100%" justify="center">
            <Button
              size="sm"
              onClick={() => playgroundStore.sendControllerUpdateMessage(true)}
            >
              Update
            </Button>
            <Switch
              size="md"
              isChecked={playgroundStore.autoUpdate}
              onChange={(e) => (playgroundStore.autoUpdate = e.target.checked)}
            >
              Auto-update
            </Switch>
          </VStack>
        )}
        <HStack my={2} pr={1} justify="center">
          <DisplayModeButtons />
          {/* <RecordCanvasControls /> */}
          {["playground", "experienceEditor"].includes(context) && (
            <SendDataButton />
          )}
          {context === "experienceEditor" && (
            <Button
              size="sm"
              colorScheme="teal"
              onClick={action(() => {
                store.selectedLayer.insertCloneOfBlock(selectedPatternBlock);
                uiStore.patternDrawerOpen = false;
              })}
            >
              Insert
            </Button>
          )}
        </HStack>

        {uiStore.playgroundDisplayMode !== "none" && (
          <VStack
            my={2}
            position="sticky"
            top={0}
            justify="center"
            alignItems="center"
            overflowX="hidden"
          >
            <Box
              className={styles.previewCanvas}
              width={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
              height={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
            >
              <PreviewCanvas block={selectedPatternBlock} />
            </Box>
          </VStack>
        )}
      </GridItem>
    </Grid>
  );
});
