import { SerializedPalette } from "@/src/types/Palette";
import { ParamType } from "@/src/types/PatternParams";

type TransferParamType = ParamType | SerializedPalette;

export type TransferParams = Record<string, { value: TransferParamType }>;

export type TransferPattern = {
  name: string;
  params: TransferParams;
};

export type TransferBlock = {
  id: string;
  pattern: TransferPattern;
  parameterVariations: { [key: string]: any[] | undefined };
  effectBlocks: TransferBlock[];
};
