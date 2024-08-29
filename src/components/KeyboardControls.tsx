import { useSaveExperience } from "@/src/hooks/experience";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

type Props = {
  editMode?: boolean;
};

export const KeyboardControls = observer(function KeyboardControls({
  editMode = false,
}: Props) {
  const store = useStore();
  const { uiStore, experienceStore, audioStore } = store;

  const { saveExperience } = useSaveExperience();

  useEffect(() => {
    const handleKeyDown = action((e: KeyboardEvent) => {
      if (editMode && e.key === "s" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        uiStore.attemptShowSaveExperienceModal();
        e.preventDefault();
      } else if (editMode && e.key === "s" && (e.ctrlKey || e.metaKey)) {
        saveExperience();
        e.preventDefault();
      } else if (editMode && e.key === "n" && (e.ctrlKey || e.metaKey)) {
        store.newExperience();
        e.preventDefault();
      }

      if (document.activeElement?.nodeName === "INPUT") return;

      if (
        e.key === " " &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        store.togglePlaying();
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        audioStore.skipBackward();
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        audioStore.skipForward();
        e.preventDefault();
      } else if (editMode && e.key === "o" && (e.ctrlKey || e.metaKey)) {
        uiStore.attemptShowOpenExperienceModal();
        e.preventDefault();
      } else if (editMode && e.key === "a" && (e.ctrlKey || e.metaKey)) {
        store.selectAllBlocks();
        e.preventDefault();
      } else if (editMode && e.key === "Escape") store.deselectAll();
      else if ((editMode && e.key === "Delete") || e.key === "Backspace") {
        store.deleteSelected();
      } else if (editMode && e.key === "d" && (e.ctrlKey || e.metaKey)) {
        store.duplicateSelected();
        e.preventDefault();
      } else if (editMode && (e.key === "+" || e.key === "=") && e.ctrlKey)
        uiStore.zoomIn(10);
      else if (editMode && e.key === "-" && e.ctrlKey) uiStore.zoomOut(10);
    });
    window.addEventListener("keydown", handleKeyDown);

    const handleCopy = (e: ClipboardEvent) => {
      if (
        !editMode ||
        !e.clipboardData ||
        document.activeElement?.nodeName === "INPUT"
      )
        return;

      store.copyToClipboard(e.clipboardData);
      e.preventDefault();
    };
    window.addEventListener("copy", handleCopy);

    const handlePaste = (e: ClipboardEvent) => {
      if (
        !editMode ||
        !e.clipboardData ||
        document.activeElement?.nodeName === "INPUT"
      )
        return;

      store.pasteFromClipboard(e.clipboardData);
      e.preventDefault();
    };
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("paste", handlePaste);
    };
  }, [store, uiStore, experienceStore, audioStore, editMode, saveExperience]);

  return null;
});
