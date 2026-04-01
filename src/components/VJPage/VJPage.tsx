import {
  Box,
  Button,
  HStack,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
  useNumberInput,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
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
import { VJPatternRadioGroup } from "@/src/components/VJPage/VJPatternRadioGroup";
import { VJLiveCanvas } from "@/src/components/VJPage/VJLiveCanvas";
import { LoginButton } from "@/src/components/LoginButton";
import { RoleSelector } from "@/src/components/RoleSelector";
import {
  vjLiveAccent,
  vjLiveAccentHover,
} from "@/src/components/VJPage/vjLiveTheme";
import { VJPresetsControls } from "@/src/components/VJPage/VJPresetsControls";
import { VJKeyboardShortcutsHelp } from "@/src/components/VJPage/VJKeyboardShortcutsHelp";
import { vjKeydownTargetIgnoresShortcuts } from "@/src/components/VJPage/vjKeyboardShortcuts";
import { playgroundPatterns } from "@/src/patterns/patterns";

const previewBorderColor = "green.300";
const inactiveBorderColor = "gray.600";
const leftCanvasPadding = 2;
const previewTopPadding = 0;

const PATTERN_NAV_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

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
  const activeEditBorderColor = liveEditing ? liveAccent : previewBorderColor;

  const [pushRequest, setPushRequest] = useState<{
    id: number;
    toBlock: Block;
  } | null>(null);
  const [xfadeInProgress, setXfadeInProgress] = useState(false);
  const [cancelCrossfadeSignal, setCancelCrossfadeSignal] = useState(0);

  const [crossfadeDurationSeconds, setCrossfadeDurationSeconds] = useState(2);
  const [crossfadeDurationInput, setCrossfadeDurationInput] = useState("2.0");

  const [deletePresetMode, setDeletePresetMode] = useState(false);

  const requestXfadePreviewToLive = () => {
    setXfadeInProgress(true);
    setPushRequest({
      id: Date.now(),
      toBlock: previewSession.selectedPatternBlock.clone(),
    });
  };

  const handleXfadePress = () => {
    if (xfadeInProgress) {
      setCancelCrossfadeSignal((n) => n + 1);
    } else {
      requestXfadePreviewToLive();
    }
  };

  const hotkeysRef = useRef({
    editingSession,
    liveSession,
    previewSession,
    setDeletePresetMode,
    setEditingSession,
    handleXfadePress,
  });
  hotkeysRef.current = {
    editingSession,
    liveSession,
    previewSession,
    setDeletePresetMode,
    setEditingSession,
    handleXfadePress,
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (vjKeydownTargetIgnoresShortcuts(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const t = e.target;
      if (
        PATTERN_NAV_KEYS.has(e.key) &&
        t instanceof HTMLElement &&
        t.closest('[role="radiogroup"]')
      ) {
        return;
      }

      const h = hotkeysRef.current;
      const session =
        h.editingSession === "live" ? h.liveSession : h.previewSession;
      const patternCount = playgroundPatterns.length;
      if (patternCount === 0) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        session.onSelectPattern(
          (session.selectedPatternIndex - 1 + patternCount) % patternCount,
        );
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        session.onSelectPattern(
          (session.selectedPatternIndex + 1) % patternCount,
        );
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        session.onSelectPattern(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        session.onSelectPattern(patternCount - 1);
        return;
      }

      if (e.key === "d") {
        e.preventDefault();
        h.setDeletePresetMode((v) => !v);
        return;
      }
      if (e.key === "v") {
        e.preventDefault();
        h.setEditingSession((s) => (s === "live" ? "preview" : "live"));
        return;
      }
      if (e.key === "X") {
        e.preventDefault();
        h.handleXfadePress();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onCrossfadeDurationChange = (
    valueString: string,
    valueNumber: number,
  ) => {
    setCrossfadeDurationInput(valueString);
    if (Number.isNaN(valueNumber)) return;
    setCrossfadeDurationSeconds(Math.min(100, Math.max(0.05, valueNumber)));
  };

  const { getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
    step: 0.1,
    min: 0,
    max: 100,
    value: crossfadeDurationInput,
    onChange: onCrossfadeDurationChange,
  });

  return (
    <Box position="relative" w="100vw" h="100vh">
      <Box
        position="absolute"
        top={1}
        right={2}
        zIndex={20}
        bg="gray.600"
        borderRadius="md"
        px={1}
        py={1}
      >
        <HStack spacing={2} alignItems="center">
          <RoleSelector />
          <Box>
            <LoginButton />
          </Box>
        </HStack>
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
                    borderColor={liveEditing ? liveAccent : inactiveBorderColor}
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
                    <VJLiveCanvas
                      key={`live-${liveSession.renderNonce}`}
                      block={liveSession.selectedPatternBlock}
                      displayMode={displayMode}
                      transmitDataEnabled
                      pushRequest={pushRequest}
                      onCrossfadeComplete={() => {
                        setXfadeInProgress(false);
                        // Align the live editing state to match preview after the fade.
                        liveSession.copySelectionFrom(previewSession);
                        // Prevent remounting from restarting the same crossfade.
                        setPushRequest(null);
                      }}
                      crossfadeDurationSeconds={crossfadeDurationSeconds}
                      cancelCrossfadeSignal={cancelCrossfadeSignal}
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
                <HStack spacing={1} alignItems="center">
                  <Text fontSize="xs" color="gray.300">
                    Xfade (s)
                  </Text>
                  <HStack spacing={0}>
                    <Button
                      size="xs"
                      borderTopRightRadius={0}
                      borderBottomRightRadius={0}
                      aria-label="Decrease crossfade duration"
                      {...getDecrementButtonProps()}
                    >
                      -
                    </Button>
                    <NumberInput
                      aria-label="Crossfade duration in seconds"
                      size="xs"
                      min={0}
                      max={100}
                      step={0.1}
                      value={crossfadeDurationInput}
                      onChange={onCrossfadeDurationChange}
                    >
                      <NumberInputField
                        w="72px"
                        textAlign="center"
                        padding={0}
                      />
                    </NumberInput>
                    <Button
                      size="xs"
                      borderTopLeftRadius={0}
                      borderBottomLeftRadius={0}
                      aria-label="Increase crossfade duration"
                      {...getIncrementButtonProps()}
                    >
                      +
                    </Button>
                  </HStack>
                </HStack>
                <Button
                  aria-label={
                    xfadeInProgress
                      ? "Cancel crossfade and go to preview now"
                      : "Xfade preview to live"
                  }
                  title={
                    xfadeInProgress
                      ? "Cancel crossfade and go to preview now"
                      : "Xfade preview to live"
                  }
                  leftIcon={<FaArrowUp />}
                  size="sm"
                  variant="outline"
                  borderColor={liveAccent}
                  color={liveAccent}
                  _hover={{ borderColor: liveHover, color: liveHover }}
                  onClick={handleXfadePress}
                >
                  {xfadeInProgress ? "Cancel xfade" : "Xfade preview to live"}
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
                    />
                  </Box>
                </VStack>
              </Box>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={75}>
          <Box
            position="relative"
            display="flex"
            flexDirection="column"
            w="100%"
            minW={0}
            maxW="100%"
            h="100%"
            minH={0}
            overflow="hidden"
            borderWidth={1}
            borderStyle="solid"
            borderColor="gray.600"
            borderRadius={0}
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
              flexShrink={0}
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
            <Box
              flex="1"
              minH={0}
              minW={0}
              overflowX="hidden"
              overflowY="auto"
            >
              <VStack
                width="100%"
                minW={0}
                maxW="100%"
                spacing={2}
                pt={1}
                pr={1}
                pb={1}
                pl={2}
              >
                <VJPresetsControls
                  session={session}
                  accentColor={activeEditBorderColor}
                  editingLabel={liveEditing ? "Live" : "Preview"}
                  deletePresetMode={deletePresetMode}
                  onDeletePresetModeChange={setDeletePresetMode}
                />
                <VStack align="stretch" spacing={2} width="100%" minW={0} ml={2}>
                  <Text fontSize="md" fontWeight="bold" color="gray.200">
                    Choose a pattern
                  </Text>
                  <VJPatternRadioGroup
                    selectedPatternName={
                      session.selectedPatternBlock.pattern.name
                    }
                    selectedPatternIndex={session.selectedPatternIndex}
                    onSelectPattern={session.onSelectPattern}
                  />
                </VStack>
                <VJParameterControls
                  key={`params-pattern-${editingSession}-${session.renderNonce}`}
                  block={session.selectedPatternBlock as any}
                />
                <VJPatternEffectsPanel
                  key={`effects-${editingSession}-${session.renderNonce}`}
                  selectedEffectIndices={session.selectedEffectIndices}
                  onToggleEffect={session.onToggleEffect}
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
                <VJKeyboardShortcutsHelp />
              </VStack>
            </Box>
          </Box>
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
