import { Box } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TimerAndWaveform } from "@/src/components/Timeline/TimerAndWaveform";
import { PlaylistEditor } from "@/src/components/PlaylistEditor/PlaylistEditor";
import { Library } from "@/src/components/PlaylistEditor/Library";

export const PlaylistEditorPage = function PlaylistEditorPage() {
  const store = useStore();

  useEffect(() => {
    if (store.initializedClientSide) return;
    store.initializeClientSide();
  }, [store]);

  return (
    <Box position="relative" w="100vw" h="100vh">
      <PanelGroup autoSaveId="playlistEditor-1" direction="horizontal">
        <Panel defaultSize={25} minSize={20}>
          <Library />
        </Panel>
        <PanelResizeHandle />
        <Panel>
          <PanelGroup autoSaveId="playlistEditor-2" direction="vertical">
            <Panel defaultSize={45}>
              <Display />
            </Panel>
            <PanelResizeHandle />
            <Panel>
              <TimerAndWaveform />
              <PlaylistEditor />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      <KeyboardControls editMode={false} />
    </Box>
  );
};
