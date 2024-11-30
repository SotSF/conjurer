import { Arrangement } from "@/src/components/Arrangement";
import { Box } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect, useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { AddPatternButton } from "@/src/components/AddPatternButton";
import { PatternDrawer } from "@/src/components/PatternDrawer";
import { useRouter } from "next/router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";

export const ExperienceEditorPage = observer(function ExperienceEditorPage() {
  const store = useStore();
  const { uiStore, experienceStore, initializationState } = store;
  const { loadingExperienceName } = experienceStore;

  const router = useRouter();
  useEffect(() => {
    if (initializationState !== "uninitialized" || !router.isReady) return;

    console.log("initial load", router.query.experienceName);
    store.initializeClientSide(router.query.experienceName as string);
  }, [
    store,
    initializationState,
    experienceStore,
    store.experienceName,
    router.query.experienceName,
  ]);

  useEffect(() => {
    if (
      initializationState !== "initialized" ||
      !router.query.experienceName ||
      store.experienceName === router.query.experienceName ||
      loadingExperienceName === router.query.experienceName
    )
      return;

    console.log("subsequent load", router.query.experienceName);
    experienceStore.load(router.query.experienceName as string);
  }, [
    store,
    experienceStore,
    initializationState,
    loadingExperienceName,
    store.experienceName,
    router.query.experienceName,
  ]);

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
      <LoadingOverlay />
      <KeyboardControls editMode />
      <PatternDrawer />
      <AddPatternButton />
    </Box>
  );
});
