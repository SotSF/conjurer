import { Box, HStack } from "@chakra-ui/react";
import { VariationGraph } from "@/src/components/VariationGraph/VariationGraph";
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { Fragment } from "react";
import { reorder } from "@/src/utils/array";
import { Block } from "@/src/types/Block";
import { action } from "mobx";
import { VariationBound } from "@/src/components/ParameterVariations/VariationBound";
import { NewVariationButtons } from "@/src/components/ParameterVariations/NewVariationButtons";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { VariationHandle } from "@/src/components/ParameterVariations/VariationHandle";

type ParameterVariationsProps = {
  uniformName: string;
  block: Block;
};

export const ParameterVariations = observer(function ParameterVariations({
  uniformName,
  block,
}: ParameterVariationsProps) {
  const store = useStore();
  const { uiStore } = store;
  const width = uiStore.timeToX(block.duration);
  const variations = block.parameterVariations[uniformName] ?? [];

  const domain: [number, number] = [0, 1];
  for (const variation of variations) {
    const [min, max] = variation.computeDomain();
    domain[0] = Math.min(domain[0], min);
    domain[1] = Math.max(domain[1], max);
  }

  const onDragEnd: OnDragEndResponder = action((result) => {
    // dropped outside the list, do nothing
    if (!result.destination) return;

    block.parameterVariations[uniformName] = reorder(
      variations,
      result.source.index,
      result.destination.index,
    );
  });

  const multipleRegions = variations.length > 1;

  return (
    // make variation graphs extend over the block border
    <Box position="relative" mx="-2px">
      {/* the curve(s) — the always-visible content that defines the lane height */}
      <HStack width="100%" justify="start" spacing={0}>
        {variations.map((variation) => (
          <Fragment key={variation.id}>
            <VariationGraph
              uniformName={uniformName}
              variation={variation}
              width={
                variation.duration < 0
                  ? width
                  : (variation.duration / block.duration) * width
              }
              domain={domain}
              block={block}
            />
            <VariationBound
              uniformName={uniformName}
              block={block}
              variation={variation}
            />
          </Fragment>
        ))}
        <NewVariationButtons uniformName={uniformName} block={block} />
      </HStack>

      {/* region controls (drag / type / reset / delete) — an overlay revealed
          only when the lane is hovered, so lanes stay quiet by default */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        zIndex={2}
        opacity={0}
        pointerEvents="none"
        transition="opacity 0.12s"
        _groupHover={{ opacity: 1, pointerEvents: "auto" }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={block.id + uniformName} direction="horizontal">
            {(provided) => (
              <HStack
                ref={provided.innerRef}
                {...provided.droppableProps}
                width="100%"
                justify="start"
                spacing={0}
                bg="rgba(15,17,21,.85)"
              >
                {variations.map((variation, index) => (
                  <Draggable
                    draggableId={variation.id}
                    index={index}
                    key={variation.id}
                    isDragDisabled={!multipleRegions}
                  >
                    {(provided) => (
                      <HStack
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        height={5}
                        width={uiStore.timeToXPixels(variation.duration)}
                        justify="center"
                        spacing={0}
                        cursor={multipleRegions ? "grab" : "default"}
                      >
                        <VariationHandle
                          block={block}
                          uniformName={uniformName}
                          variation={variation}
                        />
                      </HStack>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </HStack>
            )}
          </Droppable>
        </DragDropContext>
      </Box>
    </Box>
  );
});
