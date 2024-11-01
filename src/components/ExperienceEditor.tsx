import { Arrangement } from "@/src/components/Arrangement";
import { Box } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { AddPatternButton } from "@/src/components/AddPatternButton";
import { PlaylistDrawer } from "@/src/components/PlaylistDrawer";
import { PatternDrawer } from "@/src/components/PatternDrawer";
import { useRouter } from "next/router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const ExperienceEditor = observer(function ExperienceEditor() {
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
          <Arrangement />
        </Panel>
      </PanelGroup>
      <KeyboardControls editMode />
      <PatternDrawer />
      <PlaylistDrawer />
      <AddPatternButton />
    </Box>
  );
});
