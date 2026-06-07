import { Button } from "@chakra-ui/react";
import { action } from "mobx";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { Palette } from "@/src/types/Palette";
import { PaletteEditorModal } from "@/src/components/PalletteEditor/PaletteEditorModal";

type PaletteVariationControlsProps = {
  uniformName: string;
  variation: PaletteVariation;
  block: Block;
};

export const PaletteVariationControls = function PaletteVariationControls({
  uniformName,
  variation,
  block,
}: PaletteVariationControlsProps) {
  const { uiStore } = useStore();

  const setPalette = (palette: Palette) => {
    variation.palette = palette;
    block.triggerVariationReactions(uniformName);
  };

  return (
    <>
      <Button
        mb={1}
        onClick={action(() => (uiStore.showingPaletteEditorModal = true))}
      >
        Edit
      </Button>
      <PaletteEditorModal
        uniformName={uniformName}
        variation={variation}
        block={block}
        setPalette={setPalette}
      />
    </>
  );
};
