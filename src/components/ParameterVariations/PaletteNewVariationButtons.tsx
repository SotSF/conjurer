import { IconButton } from "@chakra-ui/react";
import { memo } from "react";
import { MdColorLens } from "react-icons/md";
import { Block } from "@/src/types/Block";
import { PatternParam } from "@/src/types/PatternParams";
import { action } from "mobx";
import { useStore } from "@/src/types/StoreContext";
import { Palette, isPalette } from "@/src/types/Palette";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";

type PaletteNewVariationButtonsProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam<Palette>;
};

export const PaletteNewVariationButtons = memo(function PaletteNewVariationButtons({
  block,
  uniformName,
}: PaletteNewVariationButtonsProps) {
  const store = useStore();

  return (
    <IconButton
      size="xs"
      aria-label="Color palette"
      title="Color palette"
      height={6}
      icon={<MdColorLens size={17} />}
      onClick={action(() => {
        const lastValue = block.getLastParameterValue(uniformName);
        if (lastValue && isPalette(lastValue)) {
          store.addVariation(
            block,
            uniformName,
            new PaletteVariation(
              DEFAULT_VARIATION_DURATION,
              new Palette(lastValue.a, lastValue.b, lastValue.c, lastValue.d),
            ),
          );
          return;
        }

        store.addVariation(
          block,
          uniformName,
          new PaletteVariation(DEFAULT_VARIATION_DURATION, Palette.default()),
        );
      })}
    />
  );
});
