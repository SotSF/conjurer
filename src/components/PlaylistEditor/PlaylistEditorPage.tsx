import { Box } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TimerAndWaveform } from "@/src/components/Timeline/TimerAndWaveform";
import { PlaylistEditor } from "@/src/components/PlaylistEditor/PlaylistEditor";

export const PlaylistEditorPage = observer(function PlaylistEditorPage() {
  const store = useStore();
  const { uiStore } = store;

  useEffect(() => {
    if (store.initializedClientSide) return;
    store.initializeClientSide();
  }, [store]);

  return (
    <Box position="relative" w="100vw" h="100vh">
      <PanelGroup
        autoSaveId="experienceEditor"
        direction={uiStore.horizontalLayout ? "vertical" : "horizontal"}
      >
        <Panel defaultSize={45}>
          <Display />
        </Panel>
        <PanelResizeHandle />
        <Panel>
          <TimerAndWaveform />
          <PlaylistEditor />
        </Panel>
      </PanelGroup>
      <KeyboardControls editMode={false} />
    </Box>
  );
});