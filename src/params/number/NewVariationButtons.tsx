import { IconButton } from "@chakra-ui/react";
import { memo } from "react";
import { BsArrowUpRight } from "react-icons/bs";
import {
  TbWaveSine,
  TbVectorSpline,
  TbEaseInOutControlPoints,
} from "react-icons/tb";
import { MdTrendingFlat } from "react-icons/md";
import { PiWaveform } from "react-icons/pi";
import { Block } from "@/src/types/Block";
import { PatternParam } from "@/src/types/PatternParams";
import { action } from "mobx";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation } from "@/src/types/Variations/LinearVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import {
  DEFAULT_SPLINE_POINTS,
  SplineVariation,
} from "@/src/types/Variations/SplineVariation";
import { useStore } from "@/src/types/StoreContext";
import { EasingVariation } from "@/src/types/Variations/EasingVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";

type ScalarNewVariationButtonsProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam<number>;
};

export const ScalarNewVariationButtons = memo(function ScalarNewVariationButtons({
  block,
  uniformName,
}: ScalarNewVariationButtonsProps) {
  const store = useStore();

  return (
    <>
      <IconButton
        size="xs"
        aria-label="Flat"
        title="Flat"
        height={6}
        icon={<MdTrendingFlat size={17} />}
        onClick={action(() => {
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && typeof lastValue === "number") {
            store.addVariation(
              block,
              uniformName,
              new FlatVariation(DEFAULT_VARIATION_DURATION, lastValue),
            );
            return;
          }

          store.addVariation(
            block,
            uniformName,
            new FlatVariation(DEFAULT_VARIATION_DURATION, 1),
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
          const lastValue = block.getLastParameterValue(uniformName);
          if (typeof lastValue === "number") {
            store.addVariation(
              block,
              uniformName,
              new LinearVariation(DEFAULT_VARIATION_DURATION, lastValue, 1),
            );
            return;
          }

          store.addVariation(
            block,
            uniformName,
            new LinearVariation(DEFAULT_VARIATION_DURATION, 1, 2),
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
          store.addVariation(
            block,
            uniformName,
            new PeriodicVariation(
              DEFAULT_VARIATION_DURATION,
              "sine",
              0.5,
              2,
              0,
              0.5,
            ),
          ),
        )}
      />
      <IconButton
        size="xs"
        aria-label="Spline"
        title="Spline"
        height={6}
        icon={<TbVectorSpline size={17} />}
        onClick={action(() => {
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && typeof lastValue === "number") {
            const points = DEFAULT_SPLINE_POINTS;
            points[0].y = lastValue;
            store.addVariation(
              block,
              uniformName,
              new SplineVariation(DEFAULT_VARIATION_DURATION, points),
            );
            return;
          }

          store.addVariation(
            block,
            uniformName,
            new SplineVariation(DEFAULT_VARIATION_DURATION),
          );
        })}
      />
      <IconButton
        size="xs"
        aria-label="Ease"
        title="Ease"
        height={6}
        icon={<TbEaseInOutControlPoints size={17} />}
        onClick={action(() => {
          const lastValue = block.getLastParameterValue(uniformName);
          if (lastValue && typeof lastValue === "number") {
            store.addVariation(
              block,
              uniformName,
              new EasingVariation(
                DEFAULT_VARIATION_DURATION,
                "easeInSine",
                lastValue,
                lastValue + 1,
              ),
            );
            return;
          }

          store.addVariation(
            block,
            uniformName,
            new EasingVariation(DEFAULT_VARIATION_DURATION, "easeInSine", 0, 1),
          );
        })}
      />
      <IconButton
        size="xs"
        aria-label="Audio"
        title="Audio"
        height={6}
        icon={<PiWaveform size={17} />}
        onClick={action(() => {
          store.addVariation(
            block,
            uniformName,
            new AudioVariation(DEFAULT_VARIATION_DURATION, 1, 0, 0, store),
          );
        })}
      />
    </>
  );
});
