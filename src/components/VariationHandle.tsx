import { HStack, IconButton, Text } from "@chakra-ui/react";
import { Variation } from "@/src/types/Variations/Variation";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { MdDragIndicator } from "react-icons/md";
import { BiDuplicate } from "react-icons/bi";
import { TbTrashXFilled, TbTrashFilled } from "react-icons/tb";
import { Block } from "@/src/types/Block";
import { useState } from "react";
import { computed } from "mobx";

type VariationHandleProps = {
  block: Block;
  uniformName: string;
  variation: Variation;
};

export const VariationHandle = observer(function VariationHandle({
  block,
  uniformName,
  variation,
}: VariationHandleProps) {
  const store = useStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // cache this value, see https://mobx.js.org/computeds-with-args.html
  const isSelected = computed(
    () =>
      !!Array.from(store.selectedBlocksOrVariations).find(
        (blockOrVariation) =>
          blockOrVariation.type === "variation" &&
          blockOrVariation.variation === variation
      )
  ).get();

  return (
    <HStack spacing={0} color={isSelected ? "blue.500" : "white"}>
      <MdDragIndicator size={18} />
      <Text pointerEvents="none" userSelect="none" fontSize="x-small">
        {variation.displayName}
      </Text>
      <IconButton
        pl={2}
        variant="unstyled"
        size="xs"
        aria-label="Duplicate variation"
        title="Duplicate variation"
        height={6}
        icon={<BiDuplicate size={12} />}
        onClick={(e) => {
          store.duplicateVariation(block, uniformName, variation);
          e.stopPropagation();
        }}
        color="gray.300"
        _hover={{ color: "blue.500" }}
      />
      <IconButton
        variant="unstyled"
        size="xs"
        aria-label={confirmingDelete ? "Confirming delete" : "Delete variation"}
        title={confirmingDelete ? "Confirming delete" : "Delete variation"}
        height={6}
        icon={
          confirmingDelete ? (
            <TbTrashXFilled size={13} />
          ) : (
            <TbTrashFilled size={13} />
          )
        }
        onClick={(e) => {
          if (!confirmingDelete) {
            setConfirmingDelete(true);
          } else {
            store.deleteVariation(block, uniformName, variation);
          }
          e.stopPropagation();
        }}
        color={confirmingDelete ? "red.500" : "gray.300"}
        _hover={{ color: "red.500" }}
      />
    </HStack>
  );
});
