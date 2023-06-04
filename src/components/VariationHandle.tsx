import { HStack, IconButton, Text } from "@chakra-ui/react";
import { Variation } from "@/src/types/Variations/Variation";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { MdDragIndicator } from "react-icons/md";
import { BsFillGearFill } from "react-icons/bs";
import { Block } from "@/src/types/Block";

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
  const { selectedVariation } = useStore();
  return (
    <HStack
      spacing={0}
      color={selectedVariation?.id === variation.id ? "blue.500" : "white"}
    >
      <MdDragIndicator size={18} />
      <Text pointerEvents="none" fontSize="x-small">
        {variation.type}
      </Text>
      <IconButton
        px={1}
        variant="unstyled"
        size="xs"
        aria-label="Variation settings"
        title="Variation settings"
        height={6}
        icon={<BsFillGearFill size={12} />}
        onClick={(e) => e.stopPropagation()}
        _hover={{ color: "blue.500" }}
      />
      {/* TODO:   */}
    </HStack>
  );
});
