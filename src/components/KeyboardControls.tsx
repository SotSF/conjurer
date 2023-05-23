import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

export const KeyboardControls = observer(function KeyboardControls() {
  const store = useStore();
  const { timer, uiStore, experienceStore } = store;

  useEffect(() => {
    const handleKeyDown = action((e: KeyboardEvent) => {
      if (document.activeElement?.nodeName === "INPUT") return;

      if (
        e.key === " " &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        timer.togglePlaying();
        e.preventDefault();
      } else if (e.key === "ArrowLeft") timer.skipBackward();
      else if (e.key === "ArrowRight") timer.skipForward();
      else if (e.key === "o" && (e.ctrlKey || e.metaKey)) {
        uiStore.showingOpenExperienceModal = true;
        e.preventDefault();
      } else if (e.key === "s" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        uiStore.showingSaveExperienceModal = true;
        e.preventDefault();
      } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        experienceStore.saveToS3();
        e.preventDefault();
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        store.selectAllBlocks();
        e.preventDefault();
      } else if (e.key === "Escape") store.deselectAllBlocks();
      else if (e.key === "Delete" || e.key === "Backspace") {
        store.deleteSelected();
      } else if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
        store.duplicateSelected();
        e.preventDefault();
      } else if (e.key === "+" || e.key === "=") uiStore.zoomIn();
      else if (e.key === "-") uiStore.zoomOut();
      // else if (e.key === "z" && e.ctrlKey) store.undo();
      // else if (e.key === "y" && e.ctrlKey) store.redo();
    });
    window.addEventListener("keydown", handleKeyDown);

    const handleCopy = (e: ClipboardEvent) => {
      if (!e.clipboardData || document.activeElement?.nodeName === "INPUT")
        return;

      store.copyBlocksToClipboard(e.clipboardData);
      e.preventDefault();
    };
    window.addEventListener("copy", handleCopy);

    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || document.activeElement?.nodeName === "INPUT")
        return;

      store.pasteBlocksFromClipboard(e.clipboardData);
      e.preventDefault();
    };
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("paste", handlePaste);
    };
  }, [store, timer, uiStore, experienceStore]);

  return null;
});
