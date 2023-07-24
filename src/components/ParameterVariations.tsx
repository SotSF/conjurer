import { ExtraParams } from "@/src/types/PatternParams";
import { HStack, VStack } from "@chakra-ui/react";
import { VariationGraph } from "@/src/components/VariationGraph/VariationGraph";
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { Fragment } from "react";
import { reorder } from "@/src/utils/algorithm";
import { Block } from "@/src/types/Block";
import { action } from "mobx";
import { VariationBound } from "@/src/components/VariationBound";
import { NewVariationButtons } from "@/src/components/NewVariationButtons";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { VariationHandle } from "@/src/components/VariationHandle";
import { useVariationClick } from "@/src/hooks/variationClick";

type ParameterVariationsProps = {
  uniformName: string;
  block: Block<ExtraParams>;
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
      result.destination.index
    );
  });

  const onVariationClick = useVariationClick(block, uniformName);

  return (
    <VStack spacing={0}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={block.id + uniformName} direction="horizontal">
          {(provided, snapshot) => (
            <HStack
              ref={provided.innerRef}
              {...provided.droppableProps}
              width="100%"
              justify="start"
              spacing={0}
            >
              {variations.map((variation, index) => (
                <Draggable
                  draggableId={variation.id}
                  index={index}
                  key={variation.id}
                >
                  {(provided, snapshot) => (
                    <HStack
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      height={4}
                      width={uiStore.timeToXPixels(variation.duration)}
                      justify="center"
                      spacing={0}
                      cursor="grab"
                      role="button"
                      onClick={(e) => onVariationClick(e, variation)}
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
    </VStack>
  );
});
