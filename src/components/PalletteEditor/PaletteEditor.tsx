import { Button, HStack } from "@chakra-ui/react";
import { memo } from "react";
import { PaletteVariationGraph } from "@/src/components/VariationGraph/PaletteVariationGraph";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { Block } from "@/src/types/Block";
import { Palette } from "@/src/types/Palette";

type PaletteEditorProps = {
  uniformName: string;
  variation: PaletteVariation;
  block: Block;
  setPalette?: (palette: Palette) => void;
};

export const PaletteEditor = memo(function PaletteEditor({
  uniformName,
  variation,
  block,
  setPalette,
}: PaletteEditorProps) {
  const randomize = () => {
    variation.palette.randomize();
    setPalette?.(variation.palette);
  };

  return (
    <HStack>
      <PaletteVariationGraph
        uniformName={uniformName}
        variation={variation}
        width={300}
        block={block}
      />
      <Button onClick={randomize}>Randomize</Button>
    </HStack>
  );
});

// const [palette, setPalette] = useState(JSON.stringify(variation.palette));
/* <HStack width="100%" justify="end" mx={1}>
        <Text>Palette</Text>

        <Input
            value={palette}
            onChange={(event) => {
              try {
                const newPalette = JSON.parse(event.target.value);
                if (isPalette(newPalette)) {
                  const { a, b, c, d } = newPalette;
                  variation.palette.a = new Vector3(a.x, a.y, a.z);
                  variation.palette.b = new Vector3(b.x, b.y, b.z);
                  variation.palette.c = new Vector3(c.x, c.y, c.z);
                  variation.palette.d = new Vector3(d.x, d.y, d.z);
                }
                setPalette(JSON.stringify(variation.palette));
                block.triggerVariationReactions(uniformName);
              } catch (e) {}
            }}
            placeholder="Color palette"
            size="sm"
          />
      </HStack> */
