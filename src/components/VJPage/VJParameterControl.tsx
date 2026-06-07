import { Box } from "@chakra-ui/react";
import { memo } from "react";
import { Block } from "@/src/types/Block";
import { isPaletteParam, PatternParam } from "@/src/types/PatternParams";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { VJPaletteParameterControl } from "@/src/components/VJPage/VJPaletteParameterControl";
import { ParamDefinitions } from "@/src/paramDefinitions/ParamDefinitions";

type VJParameterControlProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam;
};

export const VJParameterControl = memo(function VJParameterControl({
  block,
  uniformName,
  patternParam,
}: VJParameterControlProps) {
  if (BASE_UNIFORMS.includes(uniformName)) return null;

  const props = {
    key: uniformName,
    block,
    uniformName,
  };

  for (let paramDefinition of ParamDefinitions) {
    const control = paramDefinition.renderVJControl(patternParam, props);
    if (control) {
      return (
        <Box
          p={1}
          width="100%"
          minW={0}
          maxW="100%"
          _odd={{ bgColor: "whiteAlpha.200" }}
          _even={{ bgColor: "whiteAlpha.50" }}
        >
          {control}
        </Box>
      );
    }
  }

  let parameterControl = null;
  if (isPaletteParam(patternParam))
    parameterControl = (
      <VJPaletteParameterControl
        {...props}
        key={props.key}
        patternParam={patternParam}
      />
    );

  return (
    <Box
      p={1}
      width="100%"
      minW={0}
      maxW="100%"
      _odd={{ bgColor: "whiteAlpha.200" }}
      _even={{ bgColor: "whiteAlpha.50" }}
    >
      {parameterControl}
    </Box>
  );
});
