import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useStore } from "@/src/types/StoreContext";
import { VJPreviewCanvas, VJDisplayMode } from "@/src/components/VJPage/VJPreviewCanvas";
import { VJDisplayModeButtons } from "@/src/components/VJPage/VJDisplayModeButtons";
import { VJSendDataButton } from "@/src/components/VJPage/VJSendDataButton";
import { VJPatternEffectsPanel } from "@/src/components/VJPage/VJPatternEffectsPanel";
import { useVJCanopySession } from "@/src/components/VJPage/useVJCanopySession";
import { VJParameterControls } from "@/src/components/VJPage/VJParameterControls";

const stagingStyle = {
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "black",
  width: "100%",
  height: "100%",
} as const;

export const VJPageInner = observer(function VJPageInner() {
  const store = useStore();

  const liveSession = useVJCanopySession(store);
  const stagingSession = useVJCanopySession(store);

  const [editingSession, setEditingSession] = useState<"live" | "staging">(
    "live",
  );

  const session = editingSession === "live" ? liveSession : stagingSession;

  const [displayMode, setDisplayMode] = useState<VJDisplayMode>("canopy");

  return (
    <Box position="relative" w="100vw" h="100vh">
      <PanelGroup autoSaveId="vj-1" direction="horizontal">
        <Panel defaultSize={25}>
          <PanelGroup autoSaveId="vj-2" direction="vertical">
            <Panel defaultSize={70}>
              <Box position="relative" height="100%">
                <HStack
                  position="absolute"
                  justify="center"
                  top={0}
                  width="100%"
                  zIndex={10}
                >
                  <VJDisplayModeButtons
                    displayMode={displayMode}
                    onChange={setDisplayMode}
                  />
                  <VJSendDataButton />
                </HStack>
                <Box height="100%" pt={10}>
                  <VJPreviewCanvas
                    block={liveSession.selectedPatternBlock}
                    displayMode={displayMode}
                    transmitDataEnabled
                  />
                </Box>
              </Box>
            </Panel>
            <PanelResizeHandle />
            <Panel defaultSize={30}>
              <Box p={4} {...stagingStyle}>
                <VStack height="100%" width="100%" alignItems="flex-start" spacing={2}>
                  <Text fontWeight="bold">Staging</Text>
                  <Box flex={1} width="100%">
                    <VJPreviewCanvas
                      block={stagingSession.selectedPatternBlock}
                      displayMode={displayMode}
                      transmitDataEnabled={false}
                      enableCameraControls={false}
                    />
                  </Box>
                </VStack>
              </Box>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={75}>
          <VStack p={2} overflowY="auto" height="100%">
            <HStack width="100%" spacing={2} mb={2}>
              <Button
                size="sm"
                variant={editingSession === "live" ? "solid" : "outline"}
                colorScheme="teal"
                onClick={() => setEditingSession("live")}
              >
                Edit Live
              </Button>
              <Button
                size="sm"
                variant={editingSession === "staging" ? "solid" : "outline"}
                colorScheme="teal"
                onClick={() => setEditingSession("staging")}
              >
                Edit Staging
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                onClick={() => {
                  liveSession.copySelectionFrom(stagingSession);
                  setEditingSession("live");
                }}
              >
                Push Staging to Live
              </Button>
            </HStack>
            <VJPatternEffectsPanel
              selectedPatternName={session.selectedPatternBlock.pattern.name}
              onSelectPattern={session.onSelectPattern}
              selectedEffectIndices={session.selectedEffectIndices}
              onToggleEffect={session.onToggleEffect}
            />
            <VStack width="100%" spacing={2} mt={2}>
              <VJParameterControls block={session.selectedPatternBlock as any} />
              {session.selectedEffectIndices.map((effectIndex) => {
                const effectBlock = session.effectBlocks[effectIndex];
                if (!effectBlock) return null;
                return (
                  <VJParameterControls
                    key={effectBlock.id}
                    block={effectBlock as any}
                  />
                );
              })}
            </VStack>
          </VStack>
        </Panel>
      </PanelGroup>
    </Box>
  );
});

export const VJPage = observer(function VJPage() {
  const store = useStore();

  useEffect(() => {
    if (store.initializationState !== "uninitialized") return;
    void store.initializeClientSide();
  }, [store]);

  return (
    store.initializationState === "initialized" && <VJPageInner />
  );
});

