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
import { ScalarParameterControl } from "@/src/components/PatternPlayground/ScalarParameterControl";
import { ColorParameterControl } from "@/src/components/PatternPlayground/ColorParameterControl";
import { PaletteParameterControl } from "@/src/components/PatternPlayground/PaletteParameterControl";
import { BooleanParameterControl } from "@/src/components/PatternPlayground/BooleanParameterControl";

type ParameterControlProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const ParameterControl = memo(function ParameterControl({
  block,
  uniformName,
  patternParam,
  parameters,
  setParameters,
}: ParameterControlProps) {
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
      <BooleanParameterControl
        {...props}
        key={props.key}
        patternParam={patternParam}
      />
    );
  else if (isNumberParam(patternParam))
    parameterControl = (
      <ScalarParameterControl
        {...props}
        key={props.key}
        patternParam={patternParam}
      />
    );
  else if (isVector4Param(patternParam))
    parameterControl = (
      <ColorParameterControl
        {...props}
        key={props.key}
        patternParam={patternParam}
      />
    );
  else if (isPaletteParam(patternParam))
    parameterControl = (
      <PaletteParameterControl
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
