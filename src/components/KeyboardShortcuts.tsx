import { Kbd, Text, VStack } from "@chakra-ui/react";
import { memo } from "react";

export const KeyboardShortcuts = memo(function KeyboardShortcuts() {
  return (
    <VStack textAlign={"center"}>
      <Text userSelect="none">
        <Kbd>spacebar</Kbd>: play/pause
      </Text>
      <Text userSelect="none">
        <Kbd>←</Kbd>/<Kbd>→</Kbd>: scan backward/forward
      </Text>
      <Text userSelect="none">
        <Kbd>ctrl</Kbd>+<Kbd>+</Kbd>/<Kbd>-</Kbd>: zoom in/out
      </Text>
      <Text userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>s</Kbd>: save
      </Text>
      <Text userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>shift</Kbd>+<Kbd>s</Kbd>: save as
      </Text>
      <Text userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>o</Kbd>: open
      </Text>
      <Text userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>a</Kbd>: select all blocks
      </Text>
      <Text userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>c</Kbd>: copy block(s)/variation(s)
      </Text>
      <Text userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>v</Kbd>: paste block(s)/variation(s)
      </Text>
      <Text userSelect="none">
        <Kbd>cmd</Kbd>+<Kbd>d</Kbd>: duplicate selected block(s)/variation(s)
      </Text>
      <Text userSelect="none">
        <Kbd>delete</Kbd>: delete selected block(s)/variation(s)
      </Text>
      {/* <Text>cmd+z: undo</Text> */}
      {/* <Text>cmd+shift+z: redo</Text> */}
    </VStack>
  );
});
