import { Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { useState } from "react";
import { TbTrashFilled, TbTrashXFilled } from "react-icons/tb";

type Props = {};

export const PresetsList = observer(function PresetsList({}: Props) {
  const { playgroundStore } = useStore();
  const [confirmingDeleteIndex, setConfirmingDeleteIndex] = useState<
    number | null
  >(null);

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
            <IconButton
              as={Button}
              size="xs"
              aria-label={
                confirmingDeleteIndex === index
                  ? "Confirming delete"
                  : "Delete variation"
              }
              title={
                confirmingDeleteIndex === index
                  ? "Confirming delete"
                  : "Delete variation"
              }
              borderTopLeftRadius={0}
              borderBottomLeftRadius={0}
              onClick={() => {
                if (confirmingDeleteIndex === index) {
                  playgroundStore.deletePreset(index);
                  setConfirmingDeleteIndex(null);
                } else {
                  setConfirmingDeleteIndex(index);
                }
              }}
              icon={
                confirmingDeleteIndex === index ? (
                  <TbTrashXFilled size={13} />
                ) : (
                  <TbTrashFilled size={13} />
                )
              }
              color={confirmingDeleteIndex === index ? "red.500" : undefined}
            ></IconButton>
          </HStack>
        ))}
        <Button size="xs" onClick={playgroundStore.saveCurrentPreset}>
          Save preset
        </Button>
      </HStack>
    </VStack>
  );
});
