import { useState } from "react";
import { Block } from "@/src/types/Block";
import { ScalarInput } from "@/src/components/ScalarInput";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";

type AudioVariationControlsProps = {
  uniformName: string;
  variation: AudioVariation;
  block: Block;
};

export function AudioVariationControls({
  uniformName,
  variation,
  block,
}: AudioVariationControlsProps) {
  const [factor, setFactor] = useState(variation.factor.toString());
  const [offset, setOffset] = useState(variation.offset.toString());
  const [smoothing, setSmoothing] = useState(variation.smoothing.toString());

  return (
    <>
      <ScalarInput
        name="Factor"
        onChange={(valueString, valueNumber) => {
          variation.factor = valueNumber;
          setFactor(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={factor}
      />
      <ScalarInput
        name="Offset"
        onChange={(valueString, valueNumber) => {
          variation.offset = valueNumber;
          setOffset(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={offset}
      />
      <ScalarInput
        name="Smoothing"
        onChange={(valueString, valueNumber) => {
          variation.smoothing = valueNumber;
          setSmoothing(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={smoothing}
        step={1}
      />
    </>
  );
}
