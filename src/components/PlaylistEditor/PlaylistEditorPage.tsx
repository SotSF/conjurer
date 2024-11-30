import { Box } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TimerAndWaveform } from "@/src/components/Timeline/TimerAndWaveform";
import { PlaylistEditor } from "@/src/components/PlaylistEditor/PlaylistEditor";
import { PlaylistLibrary } from "@/src/components/PlaylistEditor/PlaylistLibrary";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";
import { observer } from "mobx-react-lite";

export const PlaylistEditorPage = observer(function PlaylistEditorPage() {
  const store = useStore();
  const { userStore } = store;

  useEffect(() => {
    if (store.initializationState !== "uninitialized") return;
    store.initializeClientSide();
  }, [store, store.initializationState]);

  return (
    <Box key={userStore.username} position="relative" w="100vw" h="100vh">
      <PanelGroup
        key={userStore.username}
        autoSaveId="playlistEditor-1"
        direction="horizontal"
      >
        <Panel defaultSize={25} minSize={20}>
          <PlaylistLibrary />
        </Panel>
        <PanelResizeHandle />
        <Panel>
          <PanelGroup autoSaveId="playlistEditor-2" direction="vertical">
            <Panel defaultSize={45}>
              <Display />
            </Panel>
            <PanelResizeHandle />
            <Panel>
              <Box height="100%" overflowX="hidden" overflowY="auto">
                <TimerAndWaveform />
                <PlaylistEditor />
              </Box>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      <LoadingOverlay />
      <KeyboardControls editMode={false} />
    </Box>
  );
});
