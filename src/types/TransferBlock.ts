import { ParamType } from "@/src/types/PatternParams";

export type TransformParams = Record<string, { value: ParamType }>;

export type TransferPattern = {
  name: string;
  params: TransformParams;
};

export type TransferBlock = {
  id: string;
  pattern: TransferPattern;
  effectBlocks: TransferBlock[];
};
