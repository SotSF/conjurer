import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { PresetButton } from "@/src/components/PatternPlayground/PresetButton";

export const PresetsList = observer(function PresetsList() {
  const { playgroundStore } = useStore();
  return (
    <VStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
      <Text fontSize="md" fontWeight="bold">
        Presets
      </Text>
      <HStack flexWrap="wrap" gap={1} spacing={0}>
        {playgroundStore.presets.map((preset, index) => (
          <PresetButton key={index} index={index} preset={preset} />
        ))}
        <Button size="xs" onClick={playgroundStore.saveCurrentPreset}>
          Save preset
        </Button>
      </HStack>
    </VStack>
  );
});
