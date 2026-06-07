import { IconButton } from "@chakra-ui/react";
import { memo } from "react";
import { MdColorLens } from "react-icons/md";
import { Block } from "@/src/types/Block";
import { PatternParam } from "@/src/types/PatternParams";
import { action } from "mobx";
import { Vector4 } from "three";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { useStore } from "@/src/types/StoreContext";

type Vector4NewVariationButtonsProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam<Vector4>;
};

export const Vector4NewVariationButtons = memo(
  function Vector4NewVariationButtons({
    block,
    uniformName,
  }: Vector4NewVariationButtonsProps) {
    const store = useStore();

    return (
      <IconButton
        size="xs"
        aria-label="Linear4"
        title="Linear color change"
        height={6}
        icon={<MdColorLens size={17} />}
        onClick={action(() => {
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && lastValue instanceof Vector4) {
            store.addVariation(
              block,
              uniformName,
              new LinearVariation4(
                DEFAULT_VARIATION_DURATION,
                lastValue.clone(),
                lastValue.clone(),
              ),
            );
            return;
          }

          store.addVariation(
            block,
            uniformName,
            new LinearVariation4(
              DEFAULT_VARIATION_DURATION,
              new Vector4(0, 0, 0, 1),
              new Vector4(0.32, 0.1, 0.6, 1),
            ),
          );
        })}
      />
    );
  },
);
