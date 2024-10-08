import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import {
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { VariationControls } from "@/src/components/VariationControls/VariationControls";

type Props = {
  index: number;
  layer: Layer;
};

export const TimelineLayerHeader = observer(function TimelineLayerHeader({
  index,
  layer,
}: Props) {
  const store = useStore();
  const { selectedLayer, singleVariationSelection } = store;

  const bgColor = selectedLayer === layer ? "gray.300" : "gray.400";

  return (
    <VStack
      position="sticky"
      left={0}
      width="150px"
      height="100%"
      flexShrink={0}
      spacing={0}
      zIndex={11}
      boxSizing="border-box"
      borderTopWidth={index === 0 ? 1 : 0}
      borderRightWidth={1}
      borderBottomWidth={1}
      borderColor="black"
      bgColor={bgColor}
    >
      <HStack
        position="relative"
        width="100%"
        justify="space-between"
        m={3}
        spacing={0}
      >
        <Editable
          flexGrow={1}
          px={2}
          placeholder={`Layer ${index + 1}`}
          value={layer.name}
          onChange={action((value) => (layer.name = value))}
          color="black"
          fontSize={16}
          fontWeight="bold"
          textAlign="center"
        >
          <EditablePreview />
          <EditableInput _placeholder={{ color: "gray.600" }} />
        </Editable>

        <IconButton
          minW={6}
          height={6}
          variant="unstyled"
          color={layer.visible ? "gray.500" : "red.600"}
          aria-label="Toggle layer visibility"
          title="Toggle layer visibility"
          icon={
            layer.visible ? (
              <AiFillEye size={17} />
            ) : (
              <AiFillEyeInvisible size={17} />
            )
          }
          onClick={action((e) => {
            layer.visible = !layer.visible;
            e.stopPropagation();
          })}
        />
      </HStack>
      <VStack justify="center" flexGrow={1}>
        {singleVariationSelection && store.selectedLayer === layer && (
          <VariationControls
            key={singleVariationSelection.variation.id}
            block={singleVariationSelection.block}
            uniformName={singleVariationSelection.uniformName}
            variation={singleVariationSelection.variation}
          />
        )}
      </VStack>
    </VStack>
  );
});
