import { Box, Button, Grid, GridItem, HStack, VStack } from "@chakra-ui/react";
import { PatternList } from "@/src/components/PatternPlayground/PatternList";
import { PreviewCanvas } from "@/src/components/Canvas/PreviewCanvas";
import { useCallback, useEffect, useRef, useState } from "react";
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
    lastPatternIndexSelected,
    lastEffectIndices,
  } = playgroundStore;

  // TODO: in dire need of refactoring
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(
    lastPatternIndexSelected
  );
  const selectedPatternBlock =
    patternBlocks[selectedPatternIndex] ?? patternBlocks[0];

  const [selectedEffectIndices, setSelectedEffectIndices] =
    useState<number[]>(lastEffectIndices);

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
    setSelectedPatternIndex(index);
    playgroundStore.lastPatternIndexSelected = index;

    applyPatternEffects(index, selectedEffectIndices);
  });

  const onSelectEffectBlock = action((index: number) => {
    let newSelectedEffectIndices = [...selectedEffectIndices];
    const i = newSelectedEffectIndices.indexOf(index);
    if (i >= 0) {
      // index found, remove it
      newSelectedEffectIndices.splice(i, 1);
      setSelectedEffectIndices(newSelectedEffectIndices);
    } else {
      // index not found, add it
      newSelectedEffectIndices = newSelectedEffectIndices.concat(index);
      setSelectedEffectIndices(newSelectedEffectIndices);
    }
    playgroundStore.lastEffectIndices = newSelectedEffectIndices;
    applyPatternEffects(selectedPatternIndex, newSelectedEffectIndices);
  });

  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initialize();
    onSelectPatternBlock(lastPatternIndexSelected);
    setSelectedEffectIndices(playgroundStore.lastEffectIndices);
    applyPatternEffects(lastPatternIndexSelected, lastEffectIndices);
  }, [store, lastPatternIndexSelected, lastEffectIndices, playgroundStore.lastEffectIndices, onSelectPatternBlock, applyPatternEffects]);

  return (
    <Grid
      height="100%"
      templateAreas={`"controls patterns"
                      "controls preview"`}
      gridTemplateColumns="50% 50%"
      gridTemplateRows="auto minmax(0, 1fr)"
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
            width={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
            height={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
          >
            <PreviewCanvas block={selectedPatternBlock} />
          </Box>
        </VStack>
      </GridItem>
    </Grid>
  );
});
