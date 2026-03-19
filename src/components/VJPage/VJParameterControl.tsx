import { Box } from "@chakra-ui/react";
import { memo } from "react";
import { Block } from "@/src/types/Block";
import {
  ParamType,
  PatternParam,
  isBooleanParam,
  isNumberParam,
  isPaletteParam,
  isVector4Param,
} from "@/src/types/PatternParams";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { VJScalarParameterControl } from "@/src/components/VJPage/VJScalarParameterControl";
import { VJColorParameterControl } from "@/src/components/VJPage/VJColorParameterControl";
import { VJPaletteParameterControl } from "@/src/components/VJPage/VJPaletteParameterControl";
import { VJBooleanParameterControl } from "@/src/components/VJPage/VJBooleanParameterControl";

type VJParameterControlProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const VJParameterControl = memo(function VJParameterControl({
  block,
  uniformName,
  patternParam,
  parameters,
  setParameters,
}: VJParameterControlProps) {
  if (BASE_UNIFORMS.includes(uniformName)) return null;

  const props = {
    key: uniformName,
    block,
    uniformName,
    parameters,
    setParameters,
  };

  let parameterControl = null;
  if (isBooleanParam(patternParam))
    parameterControl = (
      <VJBooleanParameterControl
        {...props}
        key={props.key}
        patternParam={patternParam}
      />
    );
  else if (isNumberParam(patternParam))
    parameterControl = (
      <VJScalarParameterControl
        {...props}
        key={props.key}
        patternParam={patternParam}
      />
    );
  else if (isVector4Param(patternParam))
    parameterControl = (
      <VJColorParameterControl
        {...props}
        key={props.key}
        patternParam={patternParam}
      />
    );
  else if (isPaletteParam(patternParam))
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
      _odd={{ bgColor: "whiteAlpha.200" }}
      _even={{ bgColor: "whiteAlpha.50" }}
    >
      {parameterControl}
    </Box>
  );
});

