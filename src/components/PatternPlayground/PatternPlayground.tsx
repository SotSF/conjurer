import { Box, Button, HStack, VStack } from "@chakra-ui/react";
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
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
// import { RecordCanvasControls } from "@/src/components/PatternPlayground/RecordCanvasControls";

export const PatternPlayground = observer(function PatternPlayground() {
  const store = useStore();
  const { uiStore, playgroundStore, userStore, context } = store;
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
    [effectBlocks, patternBlocks],
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
      playgroundStore.selectedEffectIndices,
    );
  }, [
    context,
    selectedPatternBlock,
    applyPatternEffects,
    playgroundStore,
    playgroundStore.selectedEffectIndices,
    playgroundStore.selectedPatternIndex,
  ]);

  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializeClientSide();
    applyPatternEffects(lastPatternIndexSelected, lastEffectIndices);
  }, [
    store,
    lastPatternIndexSelected,
    lastEffectIndices,
    playgroundStore.lastEffectIndices,
    onSelectPatternBlock,
    applyPatternEffects,
  ]);

  return (
    <>
      <Box key={userStore.username} position="relative" w="100vw" h="100vh">
        <PanelGroup
          key={userStore.username}
          autoSaveId="patternPlayground-1"
          direction="horizontal"
        >
          <Panel defaultSize={25}>
            <PanelGroup autoSaveId="patternPlayground-2" direction="vertical">
              <Panel defaultSize={50}>
                <Box position="relative" height="100%">
                  <HStack
                    position="absolute"
                    justify="center"
                    top={0}
                    width="100%"
                  >
                    <DisplayModeButtons />
                    {/* <RecordCanvasControls /> */}
                    {context === "playground" && <SendDataButton />}
                    {context === "experienceEditor" && (
                      <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={action(() => {
                          store.selectedLayer.insertCloneOfBlock(
                            selectedPatternBlock,
                          );
                          uiStore.patternDrawerOpen = false;
                        })}
                      >
                        Insert
                      </Button>
                    )}
                  </HStack>
                  <Box height="100%" pt={10}>
                    {uiStore.playgroundDisplayMode !== "none" && (
                      <PreviewCanvas block={selectedPatternBlock} />
                    )}
                  </Box>
                </Box>
              </Panel>
              <PanelResizeHandle />
              <Panel defaultSize={50}>
                <VStack p={2} overflowY="auto">
                  <PresetsList />
                  <PatternList
                    selectedPatternBlock={selectedPatternBlock}
                    onSelectPatternBlock={onSelectPatternBlock}
                    selectedEffectIndices={selectedEffectIndices}
                    onSelectEffectBlock={onSelectEffectBlock}
                  />
                </VStack>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle />
          <Panel defaultSize={50}>
            <VStack key={playgroundStore.id} height="100%" width="100%">
              <VStack mt={10}></VStack>
              <VStack width="100%" overflowY="auto">
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
            </VStack>
          </Panel>
        </PanelGroup>
      </Box>
    </>
  );
});
