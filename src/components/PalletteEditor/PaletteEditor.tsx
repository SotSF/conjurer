import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Text,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  Tooltip,
  YAxis,
  CartesianGrid,
  XAxis,
} from "recharts";
import { Button, HStack, VStack } from "@chakra-ui/react";
import { memo, useState } from "react";
import { PaletteVariationGraph } from "@/src/components/VariationGraph/PaletteVariationGraph";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { Block } from "@/src/types/Block";
import { Palette } from "@/src/types/Palette";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { hexToVector3 } from "@/src/utils/color";

const samples = 100;
const getPaletteSeriesData = (palette: Palette) => {
  const redData = [];
  const greenData = [];
  const blueData = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const color = palette.colorAt(t);
    redData.push({ t, value: color.x });
    greenData.push({ t, value: color.y });
    blueData.push({ t, value: color.z });
  }
  return [
    { name: "red", data: redData },
    { name: "green", data: greenData },
    { name: "blue", data: blueData },
  ];
};

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
  const [color, setColor] = useState("#efa6b4");
  const randomize = (useSeed = false) => {
    variation.palette.randomize();
    if (useSeed) variation.palette.a = hexToVector3(color);
    setPalette?.(variation.palette);
    console.log(variation.palette.toConstructorString());
  };

  const series = getPaletteSeriesData(variation.palette);
  return (
    <VStack>
      <LineChart
        width={200}
        height={100}
        margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="t" type="number" hide />
        <YAxis type="number" domain={[0, 1]} hide allowDataOverflow />
        {series.map(({ name, data }) => (
          <Line
            key={name}
            dot={false}
            isAnimationActive={false}
            type="monotone"
            dataKey="value"
            data={data}
            name={name}
            stroke={name}
            strokeWidth={2}
          />
        ))}
        <Tooltip isAnimationActive={false} content={<ColorValuesTooltip />} />
      </LineChart>
      <PaletteVariationGraph
        uniformName={uniformName}
        variation={variation}
        width={200}
        block={block}
      />
      <Accordion width="100%" allowToggle>
        <AccordionItem>
          <AccordionButton>
            <HStack>
              <Text>Randomize with seed color</Text>
              <AccordionIcon />
            </HStack>
          </AccordionButton>

          <AccordionPanel>
            <HStack>
              <VStack>
                <HexColorInput
                  className="hexColorInput"
                  color={color}
                  onChange={setColor}
                />
                <HexColorPicker color={color} onChange={setColor} />
              </VStack>
              <VStack>
                <Box w={12} h={12} bg={color} />
                <Button onClick={() => randomize(true)}>
                  Randomize with seed color
                </Button>
              </VStack>
            </HStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <HStack>
        <Button onClick={() => randomize()}>Randomize</Button>
      </HStack>
    </VStack>
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

const ColorValuesTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any;
}) => {
  if (!(active && payload && payload.length)) return null;

  return (
    <>
      <Text fontSize={12}>{`red: ${payload[0].value.toFixed(2)}`}</Text>
      <Text fontSize={12}>{`green: ${payload[1].value.toFixed(2)}`}</Text>
      <Text fontSize={12}>{`blue: ${payload[2].value.toFixed(2)}`}</Text>
    </>
  );
};
