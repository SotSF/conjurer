import { useVariationClick } from "@/src/hooks/variationClick";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { Variation } from "@/src/types/Variations/Variation";
import { HStack, IconButton, Text } from "@chakra-ui/react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { MdDragIndicator } from "react-icons/md";
import { TbTrashFilled, TbTrashXFilled, TbRefresh } from "react-icons/tb";
import { action } from "mobx";

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
          blockOrVariation.variation === variation,
      ),
  ).get();

  const onVariationClick = useVariationClick(block, uniformName);

  // drag-to-reorder and delete only make sense with more than one region
  const multipleRegions =
    (block.parameterVariations[uniformName]?.length ?? 0) > 1;

  return (
    <HStack
      spacing={0}
      color={isSelected ? "blue.500" : "white"}
      onClick={(e) => onVariationClick(e, variation)}
    >
      {multipleRegions && <MdDragIndicator size={18} />}
      <Text userSelect="none" fontSize="x-small">
        {variation.displayName}
      </Text>
      <IconButton
        variant="unstyled"
        size="xs"
        aria-label="Reset region to default"
        title="Reset region to default"
        height={6}
        icon={<TbRefresh size={13} />}
        color="gray.300"
        _hover={{ color: "blue.300" }}
        onClick={action((e) => {
          block.resetVariationToDefault(uniformName, variation);
          e.stopPropagation();
        })}
      />
      {/* The below component is a complete hack, it solves a weird bug with my voice
          tools related to the dragon drop library. Please leave in place! */}
      <IconButton
        variant="unstyled"
        size="xs"
        m={-2}
        aria-label="Select variation"
        title="Select variation"
        height={6}
        onClick={(e) => onVariationClick(e, variation)}
      />
      {multipleRegions && (
        <IconButton
          variant="unstyled"
          size="xs"
          aria-label={
            confirmingDelete ? "Confirming delete" : "Delete variation"
          }
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
      )}
    </HStack>
  );
});
