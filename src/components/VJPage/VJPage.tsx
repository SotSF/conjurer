import {
  Box,
  Button,
  HStack,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

import { useStore } from "@/src/types/StoreContext";
import { Block } from "@/src/types/Block";
import {
  VJPreviewCanvas,
  VJDisplayMode,
} from "@/src/components/VJPage/VJPreviewCanvas";
import { VJDisplayModeButtons } from "@/src/components/VJPage/VJDisplayModeButtons";
import { VJSendDataButton } from "@/src/components/VJPage/VJSendDataButton";
import { VJPatternEffectsPanel } from "@/src/components/VJPage/VJPatternEffectsPanel";
import { useVJCanopySession } from "@/src/components/VJPage/useVJCanopySession";
import { VJParameterControls } from "@/src/components/VJPage/VJParameterControls";
import { VJLivePreviewCanvas } from "@/src/components/VJPage/VJLivePreviewCanvas";
import { RoleSelector } from "@/src/components/RoleSelector";
import {
  vjLiveAccent,
  vjLiveAccentHover,
} from "@/src/components/VJPage/vjLiveTheme";

const previewBorderColor = "green.300";
const inactiveBorderColor = "gray.600";
const leftCanvasPadding = 2;
const previewTopPadding = 0;

export const VJPageInner = observer(function VJPageInner() {
  const store = useStore();

  const liveSession = useVJCanopySession(store);
  const previewSession = useVJCanopySession(store);

  const [editingSession, setEditingSession] = useState<"live" | "preview">(
    "live",
  );

  const session = editingSession === "live" ? liveSession : previewSession;
  const liveEditing = editingSession === "live";
  const previewEditing = editingSession === "preview";

  const [displayMode, setDisplayMode] = useState<VJDisplayMode>("canopy");
  const sendingData = store.sendingData;
  const liveAccent = vjLiveAccent(sendingData);
  const liveHover = vjLiveAccentHover(sendingData);
  const activeEditBorderColor = liveEditing
    ? liveAccent
    : previewBorderColor;

  const [pushRequest, setPushRequest] = useState<{
    id: number;
    toBlock: Block;
  } | null>(null);

  const [crossfadeDurationSeconds, setCrossfadeDurationSeconds] = useState(0.6);
  const [crossfadeDurationInput, setCrossfadeDurationInput] = useState("2.0");

  return (
    <Box position="relative" w="100vw" h="100vh">
      <Box
        position="absolute"
        top={2}
        right={2}
        zIndex={20}
        bg="gray.600"
        borderRadius="md"
      >
        <RoleSelector />
      </Box>
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
                      liveEditing ? liveAccent : inactiveBorderColor
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
                        bg={liveAccent}
                        borderTopLeftRadius="md"
                        borderBottomLeftRadius="md"
                        zIndex={15}
                        pointerEvents="none"
                      />
                    )}
                    <Text
                      position="absolute"
                      top={2}
                      left={liveEditing ? 4 : 2}
                      zIndex={20}
                      fontSize="xs"
                      fontWeight="bold"
                      bg={liveEditing ? liveAccent : "black"}
                      color={liveEditing ? "black" : "white"}
                      px={2}
                      py={0.5}
                      borderRadius="sm"
                      userSelect="none"
                      pointerEvents="none"
                    >
                      LIVE
                    </Text>
                    <VJLivePreviewCanvas
                      key={`live-${liveSession.renderNonce}`}
                      block={liveSession.selectedPatternBlock}
                      displayMode={displayMode}
                      transmitDataEnabled
                      pushRequest={pushRequest}
                      onCrossfadeComplete={() => {
                        // Align the live editing state to match preview after the fade.
                        liveSession.copySelectionFrom(previewSession);
                        // Prevent remounting from restarting the same crossfade.
                        setPushRequest(null);
                      }}
                      crossfadeDurationSeconds={crossfadeDurationSeconds}
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
                <HStack spacing={1}>
                  <Text fontSize="xs" color="gray.300">
                    Xfade (s)
                  </Text>
                  <NumberInput
                    aria-label="Crossfade duration in seconds"
                    size="xs"
                    width="86px"
                    min={0.05}
                    max={100}
                    step={0.05}
                    value={crossfadeDurationInput}
                    onChange={(vAsString, vAsNumber) => {
                      setCrossfadeDurationInput(vAsString);
                      if (Number.isNaN(vAsNumber)) return;
                      setCrossfadeDurationSeconds(
                        Math.min(100, Math.max(0.05, vAsNumber)),
                      );
                    }}
                  >
                    <NumberInputField textAlign="center" padding={0} />
                  </NumberInput>
                </HStack>
                <Button
                  aria-label="Xfade preview to live"
                  title="Xfade preview to live"
                  leftIcon={<FaArrowUp />}
                  size="sm"
                  variant="outline"
                  borderColor={liveAccent}
                  color={liveAccent}
                  _hover={{ borderColor: liveHover, color: liveHover }}
                  onClick={() => {
                    setPushRequest({
                      id: Date.now(),
                      toBlock: previewSession.selectedPatternBlock.clone(),
                    });
                  }}
                >
                  Xfade preview to live
                </Button>
                <Button
                  aria-label="Reset preview"
                  title="Reset preview"
                  leftIcon={<FaArrowDown />}
                  size="sm"
                  colorScheme="gray"
                  variant="outline"
                  onClick={() => {
                    previewSession.copySelectionFrom(liveSession);
                    setEditingSession("preview");
                  }}
                >
                  Reset preview
                </Button>
              </HStack>
            </Box>
            <Panel defaultSize={50} minSize={20}>
              <Box
                height="100%"
                pt={previewTopPadding}
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
                      previewEditing ? previewBorderColor : inactiveBorderColor
                    }
                    borderRightWidth={0}
                    borderTopLeftRadius="md"
                    borderBottomLeftRadius="md"
                    borderTopRightRadius={0}
                    borderBottomRightRadius={0}
                    cursor="pointer"
                    position="relative"
                    onClick={() => setEditingSession("preview")}
                  >
                    {previewEditing && (
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        height="100%"
                        width="4px"
                        bg={previewBorderColor}
                        borderTopLeftRadius="md"
                        borderBottomLeftRadius="md"
                        zIndex={15}
                        pointerEvents="none"
                      />
                    )}
                    <Text
                      position="absolute"
                      top={2}
                      left={previewEditing ? 4 : 2}
                      zIndex={20}
                      fontSize="xs"
                      fontWeight="bold"
                      bg={previewEditing ? previewBorderColor : "black"}
                      color={previewEditing ? "black" : "white"}
                      px={2}
                      py={0.5}
                      borderRadius="sm"
                      userSelect="none"
                      pointerEvents="none"
                    >
                      PREVIEW
                    </Text>
                    <VJPreviewCanvas
                      key={`preview-${previewSession.renderNonce}`}
                      block={previewSession.selectedPatternBlock}
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
            w="100%"
            minW={0}
            maxW="100%"
            overflowX="hidden"
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
              Editing {liveEditing ? "Live" : "Preview"}
            </Box>
            <VJPatternEffectsPanel
              key={`patternEffects-${editingSession}-${session.renderNonce}`}
              selectedPatternName={session.selectedPatternBlock.pattern.name}
              selectedPatternIndex={session.selectedPatternIndex}
              onSelectPattern={session.onSelectPattern}
              selectedEffectIndices={session.selectedEffectIndices}
              onToggleEffect={session.onToggleEffect}
            />
            <VStack width="100%" minW={0} maxW="100%" spacing={2} mt={2} px={2} pb={2}>
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
