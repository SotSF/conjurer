import styles from "@/styles/PatternPlayground.module.css";
import { Box, Button, Grid, GridItem, HStack, VStack } from "@chakra-ui/react";
import { PatternList } from "@/src/components/PatternPlayground/PatternList";
import { PreviewCanvas } from "@/src/components/Canvas/PreviewCanvas";
import { useCallback, useEffect, useRef } from "react";
import { ParameterControls } from "@/src/components/PatternPlayground/ParameterControls";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { action, runInAction } from "mobx";
import { DisplayModeButtons } from "@/src/components/PatternPlayground/DisplayModeButtons";
import { SendDataButton } from "@/src/components/SendDataButton";
import { sendControllerMessage } from "@/src/utils/controllerWebsocket";

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

    if (context === "controller")
      sendControllerMessage({
        type: "updateBlock",
        transferBlock: selectedPatternBlock.serializeTransferBlock(),
      });
  }, [context, selectedPatternBlock, applyPatternEffects, playgroundStore.selectedEffectIndices, playgroundStore.selectedPatternIndex]);

  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initialize();
    applyPatternEffects(lastPatternIndexSelected, lastEffectIndices);
  }, [store, lastPatternIndexSelected, lastEffectIndices, playgroundStore.lastEffectIndices, onSelectPatternBlock, applyPatternEffects]);

  return (
    <Grid className={styles.grid} height="100%">
      <GridItem area="patterns">
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
        <HStack mt={2} pr={1} width="100%" justify="end">
          <DisplayModeButtons />
          {["playground", "default"].includes(context) && <SendDataButton />}
          {context === "controller" && (
            <HStack width="100%" justify="center">
              <Button
                onClick={() =>
                  sendControllerMessage({
                    type: "updateBlock",
                    transferBlock:
                      selectedPatternBlock.serializeTransferBlock(),
                  })
                }
              >
                Update
              </Button>
            </HStack>
          )}
          {context === "default" && (
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

        <VStack
          position="sticky"
          top={0}
          height="70vh"
          justify="center"
          alignItems="center"
        >
          <Box
            className={styles.previewCanvas}
            max-width={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
            max-height={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
          >
            <PreviewCanvas block={selectedPatternBlock} />
          </Box>
        </VStack>
      </GridItem>
    </Grid>
  );
});
