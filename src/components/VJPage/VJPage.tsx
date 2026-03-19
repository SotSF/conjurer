import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

import { useStore } from "@/src/types/StoreContext";
import {
  VJPreviewCanvas,
  VJDisplayMode,
} from "@/src/components/VJPage/VJPreviewCanvas";
import { VJDisplayModeButtons } from "@/src/components/VJPage/VJDisplayModeButtons";
import { VJSendDataButton } from "@/src/components/VJPage/VJSendDataButton";
import { VJPatternEffectsPanel } from "@/src/components/VJPage/VJPatternEffectsPanel";
import { useVJCanopySession } from "@/src/components/VJPage/useVJCanopySession";
import { VJParameterControls } from "@/src/components/VJPage/VJParameterControls";

const liveBorderColor = "teal.300";
const stagingBorderColor = "purple.300";
const inactiveBorderColor = "gray.600";
const leftCanvasPadding = 2;
const stagingTopPadding = 0;

export const VJPageInner = observer(function VJPageInner() {
  const store = useStore();

  const liveSession = useVJCanopySession(store);
  const stagingSession = useVJCanopySession(store);

  const [editingSession, setEditingSession] = useState<"live" | "staging">(
    "live",
  );

  const session = editingSession === "live" ? liveSession : stagingSession;
  const liveEditing = editingSession === "live";
  const stagingEditing = editingSession === "staging";

  const [displayMode, setDisplayMode] = useState<VJDisplayMode>("canopy");
  const activeEditBorderColor = liveEditing
    ? liveBorderColor
    : stagingBorderColor;

  return (
    <Box position="relative" w="100vw" h="100vh">
      <PanelGroup autoSaveId="vj-1-v3" direction="horizontal">
        <Panel defaultSize={25}>
          <PanelGroup autoSaveId="vj-2-v3" direction="vertical">
            <Panel defaultSize={50} minSize={20}>
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
                <Box height="100%" pt={10} pl={leftCanvasPadding} pr={0}>
                  <Box
                    height="100%"
                    borderWidth={2}
                    borderStyle="solid"
                    borderColor={
                      liveEditing ? liveBorderColor : inactiveBorderColor
                    }
                    borderRightWidth={0}
                    borderTopLeftRadius="md"
                    borderBottomLeftRadius="md"
                    borderTopRightRadius={0}
                    borderBottomRightRadius={0}
                    cursor="pointer"
                    position="relative"
                    onClick={() => setEditingSession("live")}
                  >
                    {liveEditing && (
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        height="100%"
                        width="4px"
                        bg={liveBorderColor}
                        borderTopLeftRadius="md"
                        borderBottomLeftRadius="md"
                        zIndex={15}
                        pointerEvents="none"
                      />
                    )}
                    <Text
                      position="absolute"
                      top={2}
                      left={2}
                      zIndex={20}
                      fontSize="xs"
                      fontWeight="bold"
                      bg={liveEditing ? liveBorderColor : "black"}
                      color={liveEditing ? "black" : "white"}
                      px={2}
                      py={0.5}
                      borderRadius="sm"
                      userSelect="none"
                      pointerEvents="none"
                    >
                      LIVE
                    </Text>
                    <VJPreviewCanvas
                      key={`live-${liveSession.renderNonce}`}
                      block={liveSession.selectedPatternBlock}
                      displayMode={displayMode}
                      transmitDataEnabled
                    />
                  </Box>
                </Box>
              </Box>
            </Panel>
            <PanelResizeHandle />
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={2}
              pl={leftCanvasPadding}
              pr={0}
            >
              <HStack spacing={2}>
                <Button
                  aria-label="Push Staging to Live"
                  title="Push Staging to Live"
                  leftIcon={<FaArrowUp />}
                  size="sm"
                  colorScheme="orange"
                  variant="outline"
                  onClick={() => {
                    liveSession.copySelectionFrom(stagingSession);
                    setEditingSession("live");
                  }}
                >
                  Push to live
                </Button>
                <Button
                  aria-label="Reset Staging"
                  title="Reset Staging"
                  leftIcon={<FaArrowDown />}
                  size="sm"
                  colorScheme="gray"
                  variant="outline"
                  onClick={() => {
                    stagingSession.copySelectionFrom(liveSession);
                    setEditingSession("staging");
                  }}
                >
                  Reset staging
                </Button>
              </HStack>
            </Box>
            <Panel defaultSize={50} minSize={20}>
              <Box
                height="100%"
                pt={stagingTopPadding}
                pl={leftCanvasPadding}
                pr={0}
              >
                <VStack
                  height="100%"
                  width="100%"
                  alignItems="flex-start"
                  spacing={2}
                >
                  <Box
                    flex={1}
                    width="100%"
                    borderWidth={2}
                    borderStyle="solid"
                    borderColor={
                      stagingEditing ? stagingBorderColor : inactiveBorderColor
                    }
                    borderRightWidth={0}
                    borderTopLeftRadius="md"
                    borderBottomLeftRadius="md"
                    borderTopRightRadius={0}
                    borderBottomRightRadius={0}
                    cursor="pointer"
                    position="relative"
                    onClick={() => setEditingSession("staging")}
                  >
                    {stagingEditing && (
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        height="100%"
                        width="4px"
                        bg={stagingBorderColor}
                        borderTopLeftRadius="md"
                        borderBottomLeftRadius="md"
                        zIndex={15}
                        pointerEvents="none"
                      />
                    )}
                    <Text
                      position="absolute"
                      top={2}
                      left={2}
                      zIndex={20}
                      fontSize="xs"
                      fontWeight="bold"
                      bg={stagingEditing ? stagingBorderColor : "black"}
                      color={stagingEditing ? "black" : "white"}
                      px={2}
                      py={0.5}
                      borderRadius="sm"
                      userSelect="none"
                      pointerEvents="none"
                    >
                      STAGING
                    </Text>
                    <VJPreviewCanvas
                      key={`staging-${stagingSession.renderNonce}`}
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
          <VStack
            p={0}
            overflowY="auto"
            height="100%"
            borderWidth={1}
            borderStyle="solid"
            borderColor="gray.600"
            borderRadius={0}
            spacing={2}
            position="relative"
            borderLeftWidth={0}
            borderRightWidth={0}
            borderBottomWidth={0}
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              height="100%"
              width="4px"
              bg={activeEditBorderColor}
              zIndex={5}
              pointerEvents="none"
            />
            <Box
              width="100%"
              px={3}
              py={2}
              bg={activeEditBorderColor}
              color="black"
              fontWeight="bold"
              borderTopLeftRadius={0}
              borderTopRightRadius={0}
              userSelect="none"
            >
              Editing {liveEditing ? "Live" : "Staging"}
            </Box>
            <VJPatternEffectsPanel
              key={`patternEffects-${editingSession}-${session.renderNonce}`}
              selectedPatternName={session.selectedPatternBlock.pattern.name}
              selectedPatternIndex={session.selectedPatternIndex}
              onSelectPattern={session.onSelectPattern}
              selectedEffectIndices={session.selectedEffectIndices}
              onToggleEffect={session.onToggleEffect}
            />
            <VStack width="100%" spacing={2} mt={2} px={2} pb={2}>
              <VJParameterControls
                key={`params-pattern-${editingSession}-${session.renderNonce}`}
                block={session.selectedPatternBlock as any}
              />
              {session.selectedEffectIndices.map((effectIndex) => {
                const effectBlock = session.effectBlocks[effectIndex];
                if (!effectBlock) return null;
                return (
                  <VJParameterControls
                    key={`${effectBlock.id}-${editingSession}-${session.renderNonce}`}
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

  return store.initializationState === "initialized" && <VJPageInner />;
});
