import { useStore } from "@/src/types/StoreContext";
import { Kbd, Text, VStack } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

export const Keyboard = observer(function Keyboard() {
  const store = useStore();
  const { timer, uiStore } = store;

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
        // TODO: save experience
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
  }, [store, timer, uiStore]);

  return (
    <VStack textAlign={"center"}>
      <Text fontSize={9} userSelect="none">
        <Kbd>spacebar</Kbd>: play/pause
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>←</Kbd>/<Kbd>→</Kbd>: scan backward/forward
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>+</Kbd>/<Kbd>-</Kbd>: zoom in/out
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>s</Kbd>: save
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>shift</Kbd>+<Kbd>s</Kbd>: save as
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>o</Kbd>: open
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>a</Kbd>: select all blocks
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>c</Kbd>: copy block(s)
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>v</Kbd>: paste block(s)
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>d</Kbd>: duplicate selected block(s)/variation(s)
      </Text>
      <Text fontSize={9} userSelect="none">
        <Kbd>delete</Kbd>: delete selected block(s)/variation(s)
      </Text>
      {/* <Text>cmd+z: undo</Text> */}
      {/* <Text>cmd+shift+z: redo</Text> */}
    </VStack>
  );
});
