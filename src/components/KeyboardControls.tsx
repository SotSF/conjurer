import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

export const KeyboardControls = observer(function KeyboardControls() {
  const store = useStore();
  const { uiStore, experienceStore, audioStore } = store;

  useEffect(() => {
    const handleKeyDown = action((e: KeyboardEvent) => {
      if (e.key === "s" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        uiStore.showingSaveExperienceModal = true;
        e.preventDefault();
      } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        experienceStore.save();
        e.preventDefault();
      } else if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
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
      } else if (e.key === "o" && (e.ctrlKey || e.metaKey)) {
        uiStore.showingOpenExperienceModal = true;
        e.preventDefault();
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        store.selectAllBlocks();
        e.preventDefault();
      } else if (e.key === "Escape") store.deselectAll();
      else if (e.key === "Delete" || e.key === "Backspace") {
        store.deleteSelected();
      } else if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
        store.duplicateSelected();
        e.preventDefault();
      } else if (e.key === "+" || e.key === "=") uiStore.zoomIn(10);
      else if (e.key === "-") uiStore.zoomOut(10);
      // else if (e.key === "z" && e.ctrlKey) store.undo();
      // else if (e.key === "y" && e.ctrlKey) store.redo();
    });
    window.addEventListener("keydown", handleKeyDown);

    const handleCopy = (e: ClipboardEvent) => {
      if (!e.clipboardData || document.activeElement?.nodeName === "INPUT")
        return;

      store.copyToClipboard(e.clipboardData);
      e.preventDefault();
    };
    window.addEventListener("copy", handleCopy);

    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || document.activeElement?.nodeName === "INPUT")
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
  }, [store, uiStore, experienceStore, audioStore]);

  return null;
});
