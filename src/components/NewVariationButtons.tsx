import { ExtraParams } from "@/src/types/PatternParams";
import { IconButton, VStack } from "@chakra-ui/react";
import { memo } from "react";
import { BsArrowUpRight } from "react-icons/bs";
import { TbWaveSine, TbVectorSpline } from "react-icons/tb";
import { MdTrendingFlat, MdColorLens } from "react-icons/md";
import { Block } from "@/src/types/Block";
import { action } from "mobx";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation } from "@/src/types/Variations/LinearVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { Vector4 } from "three";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import {
  DEFAULT_SPLINE_POINTS,
  SplineVariation,
} from "@/src/types/Variations/SplineVariation";
import { isVector4 } from "@/src/utils/object";

type NewVariationButtonsProps = {
  uniformName: string;
  block: Block<ExtraParams>;
};

export const NewVariationButtons = memo(function NewVariationButtons({
  uniformName,
  block,
}: NewVariationButtonsProps) {
  const newVariationButtons = isVector4(
    block.pattern.params[uniformName].value
  ) ? (
    <>
      <IconButton
        size="xs"
        aria-label="Linear4"
        title="Linear color change"
        height={6}
        icon={<MdColorLens size={17} />}
        onClick={action(() => {
          // grab the last color from the previous variation if it exists
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && lastValue instanceof Vector4) {
            block.addVariation(
              uniformName,
              new LinearVariation4(
                DEFAULT_VARIATION_DURATION,
                lastValue.clone(),
                lastValue.clone()
              )
            );
            return;
          }

          block.addVariation(
            uniformName,
            new LinearVariation4(
              DEFAULT_VARIATION_DURATION,
              new Vector4(0, 0, 0, 1),
              new Vector4(0.32, 0.1, 0.6, 1)
            )
          );
        })}
      />
    </>
  ) : (
    <>
      <IconButton
        size="xs"
        aria-label="Flat"
        title="Flat"
        height={6}
        icon={<MdTrendingFlat size={17} />}
        onClick={action(() => {
          // grab the last scalar value from the previous variation if it exists
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && typeof lastValue === "number") {
            block.addVariation(
              uniformName,
              new FlatVariation(DEFAULT_VARIATION_DURATION, lastValue)
            );
            return;
          }

          block.addVariation(
            uniformName,
            new FlatVariation(DEFAULT_VARIATION_DURATION, 1)
          );
        })}
      />
      <IconButton
        size="xs"
        aria-label="Linear"
        title="Linear"
        height={6}
        icon={<BsArrowUpRight size={17} />}
        onClick={action(() => {
          // grab the last scalar value from the previous variation if it exists
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && typeof lastValue === "number") {
            block.addVariation(
              uniformName,
              new LinearVariation(DEFAULT_VARIATION_DURATION, lastValue, 1)
            );
            return;
          }

          block.addVariation(
            uniformName,
            new LinearVariation(DEFAULT_VARIATION_DURATION, 1, 2)
          );
        })}
      />
      <IconButton
        size="xs"
        aria-label="Sine"
        title="Sine"
        height={6}
        icon={<TbWaveSine size={17} />}
        onClick={action(() =>
          block.addVariation(
            uniformName,
            new PeriodicVariation(
              DEFAULT_VARIATION_DURATION,
              "sine",
              0.5,
              2,
              0,
              0.5
            )
          )
        )}
      />
      <IconButton
        size="xs"
        aria-label="Spline"
        title="Spline"
        height={6}
        icon={<TbVectorSpline size={17} />}
        onClick={action(() => {
          // grab the last scalar value from the previous variation if it exists
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && typeof lastValue === "number") {
            const points = DEFAULT_SPLINE_POINTS;
            points[0].y = lastValue;
            block.addVariation(
              uniformName,
              new SplineVariation(DEFAULT_VARIATION_DURATION, points)
            );
            return;
          }

          block.addVariation(
            uniformName,
            new SplineVariation(DEFAULT_VARIATION_DURATION)
          );
        })}
      />
    </>
  );

  return (
    <VStack
      wrap="wrap"
      pl={1}
      gap={1}
      spacing={0}
      height="60px"
      justify="center"
    >
      {newVariationButtons}
    </VStack>
  );
});
