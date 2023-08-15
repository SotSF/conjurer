import { ExtraParams } from "@/src/types/PatternParams";

type TransferPattern = {
  name: string;
  params: ExtraParams;
};

export type TransferBlock = {
  id: string;
  pattern: TransferPattern;
  effectBlocks: TransferBlock[];
};
