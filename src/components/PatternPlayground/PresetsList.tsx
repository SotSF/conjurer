import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { useState } from "react";

type Props = {};

export const PresetsList = observer(function PresetsList({}: Props) {
  const { playgroundStore } = useStore();
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  return (
    <VStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
      <Text fontSize="md" fontWeight="bold">
        Presets
      </Text>
      <HStack flexWrap="wrap" gap={1} spacing={0}>
        {playgroundStore.presets.map((preset, index) => (
          <HStack key={index} spacing={0}>
            <Button
              size="xs"
              borderTopRightRadius={0}
              borderBottomRightRadius={0}
              onClick={() => playgroundStore.loadPreset(index)}
            >
              {`${preset.pattern.name} ${index + 1}`}
            </Button>
            <Button
              size="xs"
              borderTopLeftRadius={0}
              borderBottomLeftRadius={0}
              onClick={() => {
                if (confirmingIndex === index) {
                  playgroundStore.deletePreset(index);
                  setConfirmingIndex(null);
                } else {
                  setConfirmingIndex(index);
                }
              }}
              color={confirmingIndex === index ? "red.500" : undefined}
            >
              X
            </Button>
          </HStack>
        ))}
        <Button size="xs" onClick={playgroundStore.saveCurrentPreset}>
          Save preset
        </Button>
      </HStack>
    </VStack>
  );
});
