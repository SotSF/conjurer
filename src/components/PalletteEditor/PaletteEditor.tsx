import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Center,
  NumberInput,
  NumberInputField,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
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
import { Vector3 } from "three";

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
    // Uncomment to log the palette constructor string
    // console.log(variation.palette.toConstructorString());
  };

  const series = getPaletteSeriesData(variation.palette);
  return (
    <VStack>
      <HStack>
        <PaletteVariationGraph
          uniformName={uniformName}
          variation={variation}
          width={300}
          block={block}
        />
        <Button size="xs" onClick={() => randomize()}>
          Randomize
        </Button>
      </HStack>

      <Accordion bgColor="gray.600" allowToggle>
        <AccordionItem>
          <AccordionButton>
            <HStack justify="space-between">
              <Text fontSize="sm">More options...</Text>
              <AccordionIcon fontSize="sm" />
            </HStack>
          </AccordionButton>

          <AccordionPanel>
            <Center>
              <VStack>
                <LineChart
                  width={300}
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
                  <Tooltip
                    isAnimationActive={false}
                    content={<ColorValuesTooltip />}
                  />
                </LineChart>
                <HStack mt={2}>
                  <VStack>
                    <HexColorInput
                      className="hexColorInput"
                      color={color}
                      onChange={setColor}
                    />
                    <HexColorPicker color={color} onChange={setColor} />
                  </VStack>
                  <VStack>
                    <Box w="60px" h="60px" bg={color} />
                    <Button
                      size="xs"
                      height={8}
                      onClick={() => randomize(true)}
                    >
                      Randomize
                      <br />
                      with color
                    </Button>
                  </VStack>
                </HStack>

                <ManualPaletteEditor
                  palette={variation.palette}
                  setPalette={setPalette}
                />
              </VStack>
            </Center>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </VStack>
  );
});

type ManualPaletteEditorProps = {
  palette: Palette;
  setPalette?: (palette: Palette) => void;
};

const ManualPaletteEditor = ({
  palette,
  setPalette,
}: ManualPaletteEditorProps) => {
  const onChange = (component: PaletteComponent, color: Vector3) => {
    palette[component].copy(color);
    setPalette?.(palette);
  };

  return (
    <TableContainer style={{ marginTop: 20 }}>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th />
            <Th style={{ textAlign: "center" }}>R</Th>
            <Th style={{ textAlign: "center" }}>G</Th>
            <Th style={{ textAlign: "center" }}>B</Th>
          </Tr>
        </Thead>
        <Tbody>
          <PaletteColorRow component="a" {...{ palette, onChange }} />
          <PaletteColorRow component="b" {...{ palette, onChange }} />
          <PaletteColorRow component="c" {...{ palette, onChange }} />
          <PaletteColorRow component="d" {...{ palette, onChange }} />
        </Tbody>
      </Table>
    </TableContainer>
  );
};

type PaletteComponent = "a" | "b" | "c" | "d";
type PaletteColorRowProps = {
  component: PaletteComponent;
  palette: Palette;
  onChange: (component: PaletteComponent, color: Vector3) => void;
};

const PaletteColorRow = ({
  component,
  palette,
  onChange: handleChange,
}: PaletteColorRowProps) => {
  const onChange = (newColor: Vector3) => handleChange(component, newColor);
  const data = palette[component];
  return (
    <Tr>
      <Td>{component.toUpperCase()}</Td>
      <PaletteColorComponent color="r" {...{ data, onChange }} />
      <PaletteColorComponent color="g" {...{ data, onChange }} />
      <PaletteColorComponent color="b" {...{ data, onChange }} />
    </Tr>
  );
};

type ColorComponent = "r" | "g" | "b";
type PaletteColorComponentProps = {
  data: Vector3;
  color: ColorComponent;
  onChange: (newColor: Vector3) => void;
};

const vectorAccessorMap = {
  r: "x",
  g: "y",
  b: "z",
} as const;

const PaletteColorComponent = ({
  data,
  color,
  onChange,
}: PaletteColorComponentProps) => {
  const vectorAccessor = vectorAccessorMap[color];
  const [strValue, setStrValue] = useState(data[vectorAccessor].toFixed(5));

  return (
    <Td>
      <NumberInput
        size="sm"
        min={0}
        max={1}
        value={strValue}
        onChange={(valueString, valueNumber) => {
          setStrValue(valueString);
          if (!isNaN(valueNumber)) {
            const newColor = data.clone();
            newColor[vectorAccessor] = valueNumber;
            onChange(newColor);
          }
        }}
      >
        <NumberInputField />
      </NumberInput>
    </Td>
  );
};

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
