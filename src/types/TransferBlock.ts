import { SerializedPalette } from "@/src/types/Palette";
import { ParamType } from "@/src/types/PatternParams";

type TransferParamType = ParamType | SerializedPalette;

export type TransformParams = Record<string, { value: TransferParamType }>;

export type TransferPattern = {
  name: string;
  params: TransformParams;
};

export type TransferBlock = {
  id: string;
  pattern: TransferPattern;
  parameterVariations: { [key: string]: any[] | undefined };
  effectBlocks: TransferBlock[];
};
