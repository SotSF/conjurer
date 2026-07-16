import { HStack } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
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

    useEffect(() => {
      if (!variation) {
        updatePaletteVariation();
      }
    }, [block.id, uniformName, variation, updatePaletteVariation]);

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
