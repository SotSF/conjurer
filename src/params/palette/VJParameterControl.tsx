import { HStack } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Block } from "@/src/types/Block";
import { ParamType, PatternParam } from "@/src/params/shared/patternParam";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { runInAction } from "mobx";
import { Palette } from "./Palette";
import { PaletteEditor } from "./editor/PaletteEditor";
import { PaletteVariation } from "./variation/PaletteVariation";
import { VJParameterControlName } from "@/src/components/VJPage/VJParameterControlName";

type VJPaletteParameterControlProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam<Palette>;
};

export const VJPaletteParameterControl = observer(
  function VJPaletteParameterControl({
    block,
    uniformName,
    patternParam,
  }: VJPaletteParameterControlProps) {
    const updatePaletteVariation = useCallback(() => {
      runInAction(() => {
        if (!block.parameterVariations[uniformName])
          block.parameterVariations[uniformName] = [];

        block.parameterVariations[uniformName]![0] = new PaletteVariation(
          DEFAULT_VARIATION_DURATION,
          patternParam.value,
        );
      });
    }, [block.parameterVariations, patternParam.value, uniformName]);

    const variation = block.parameterVariations[uniformName]?.[0];

    const [initialized, setInitialized] = useState(false);
    // upon initializing a palette parameter, create a variation if one does not exist
    // TODO: this is janky and probably should be done elsewhere
    useEffect(() => {
      if (variation || initialized) return;
      setInitialized(true);
      updatePaletteVariation();
    }, [updatePaletteVariation, variation, initialized]);

    const setParameter = useCallback(
      (value: Palette) => {
        block.pattern.params[uniformName].value = value;
        updatePaletteVariation();
      },
      [block.pattern.params, uniformName, updatePaletteVariation],
    );

    return (
      <HStack width="100%" maxW="100%" minW={0} flexWrap="wrap" gap={4}>
        <VJParameterControlName patternParam={patternParam} />
        {variation?.type === "palette" && (
          <PaletteEditor
            uniformName={uniformName}
            // TODO: do better type discrimination
            variation={variation as PaletteVariation}
            block={block}
            setPalette={(palette) => setParameter(palette)}
          />
        )}
      </HStack>
    );
  },
);
