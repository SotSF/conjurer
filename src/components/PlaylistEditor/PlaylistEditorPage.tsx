import { Box, IconButton } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { PlaylistDrawer } from "@/src/components/PlaylistDrawer";
import { useRouter } from "next/router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { RiPlayList2Fill } from "react-icons/ri";
import { action } from "mobx";
import { TimerAndWaveform } from "@/src/components/Timeline/TimerAndWaveform";

export const PlaylistEditorPage = observer(function PlaylistEditorPage() {
  const store = useStore();
  const { uiStore, experienceStore } = store;

  const router = useRouter();
  useEffect(() => {
    if (store.initializedClientSide || !router.query.experienceName) return;
    store.initializeClientSide(router.query.experienceName as string);
  }, [store, experienceStore, store.experienceName, router.query.experienceName]);

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
        </Panel>
      </PanelGroup>
      <KeyboardControls editMode={false} />
      <IconButton
        aria-label="Show playlist"
        title="Show playlist"
        height={6}
        icon={<RiPlayList2Fill size={17} />}
        onClick={action(() => (uiStore.playlistDrawerOpen = true))}
      />
      <PlaylistDrawer />
    </Box>
  );
});
