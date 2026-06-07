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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
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
import { memo, useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { PaletteVariationGraph } from "../variation/VariationGraph";
import { PaletteVariation } from "../variation/PaletteVariation";
import { Block } from "@/src/types/Block";
import { Palette } from "../Palette";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { hexToVector3, vector3ToHex } from "@/src/utils/color";
import { Vector3 } from "three";

const samples = 100;
const LINEAR_GRADIENT_PHASE_SWEEP = Math.PI / 3;
const LINEAR_GRADIENT_PHASE_SIN = Math.sin(LINEAR_GRADIENT_PHASE_SWEEP / 2);
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const PALETTE_COMMIT_DEBOUNCE_MS = 50;
const PALETTE_COMMIT_MAX_WAIT_MS = 100;

const setPaletteFromLinearGradient = (
  palette: Palette,
  from: Vector3,
  to: Vector3,
) => {
  const c = LINEAR_GRADIENT_PHASE_SWEEP / (2 * Math.PI);
  const d = (Math.PI / 2 - LINEAR_GRADIENT_PHASE_SWEEP / 2) / (2 * Math.PI);

  palette.c.set(c, c, c);
  palette.d.set(d, d, d);

  (["x", "y", "z"] as const).forEach((axis) => {
    const start = from[axis];
    const end = to[axis];
    palette.a[axis] = (start + end) / 2;
    palette.b[axis] = (start - end) / (2 * LINEAR_GRADIENT_PHASE_SIN);
  });
};

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
  const [gradientStartColor, setGradientStartColor] = useState(
    vector3ToHex(variation.palette.colorAt(0)),
  );
  const [gradientEndColor, setGradientEndColor] = useState(
    vector3ToHex(variation.palette.colorAt(1)),
  );
  const debouncedCommitPalette = useDebouncedCallback(
    (palette: Palette) => setPalette?.(palette),
    PALETTE_COMMIT_DEBOUNCE_MS,
    { maxWait: PALETTE_COMMIT_MAX_WAIT_MS, trailing: true },
  );

  const randomize = (useSeed = false) => {
    debouncedCommitPalette.cancel();
    variation.palette.randomize();
    if (useSeed) variation.palette.a = hexToVector3(color);
    setPalette?.(variation.palette);
    // Uncomment to log the palette constructor string
    // console.log(variation.palette.toConstructorString());
  };

  const applyLinearGradient = useCallback(
    (startColor: string, endColor: string) => {
      if (
        !HEX_COLOR_PATTERN.test(startColor) ||
        !HEX_COLOR_PATTERN.test(endColor)
      )
        return;
      setPaletteFromLinearGradient(
        variation.palette,
        hexToVector3(startColor),
        hexToVector3(endColor),
      );
      debouncedCommitPalette(variation.palette);
    },
    [debouncedCommitPalette, variation.palette],
  );

  const onStartGradientColorChange = (nextStartColor: string) => {
    setGradientStartColor(nextStartColor);
    applyLinearGradient(nextStartColor, gradientEndColor);
  };
  const onEndGradientColorChange = (nextEndColor: string) => {
    setGradientEndColor(nextEndColor);
    applyLinearGradient(gradientStartColor, nextEndColor);
  };

  const commitPaletteNow = () => debouncedCommitPalette.flush();

  const series = getPaletteSeriesData(variation.palette);
  return (
    <VStack align="start">
      <Accordion allowToggle>
        <AccordionItem border="none">
          <HStack justify="left">
            <PaletteVariationGraph
              uniformName={uniformName}
              variation={variation}
              width={300}
              block={block}
            />
            <VStack alignItems="start" height="100%" justify="center">
              <Button size="xs" width="100%" onClick={() => randomize()}>
                Randomize
              </Button>
              <AccordionButton as={Button} size="xs" px={2}>
                <Text fontSize="xs">Configure</Text>
                <AccordionIcon fontSize="sm" />
              </AccordionButton>
            </VStack>
          </HStack>

          <AccordionPanel>
            <Center>
              <VStack>
                <Tabs size="sm" variant="enclosed">
                  <TabList>
                    <Tab _selected={{ color: "white" }} color="gray.300">
                      2-Color gradient
                    </Tab>
                    <Tab _selected={{ color: "white" }} color="gray.300">
                      Randomize w/ color
                    </Tab>
                    <Tab _selected={{ color: "white" }} color="gray.300">
                      Raw
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel px={0}>
                      <VStack w="100%">
                        <HStack alignItems="flex-start">
                          <VStack>
                            <HStack mb={3}>
                              <Text fontSize="xs">Start color</Text>
                              <Box
                                w="20px"
                                h="20px"
                                bg={gradientStartColor}
                                border="1px solid"
                                borderColor="whiteAlpha.400"
                                flexShrink={0}
                              />
                              <HexColorInput
                                className="hexColorInput"
                                color={gradientStartColor}
                                onChange={onStartGradientColorChange}
                              />
                            </HStack>
                            <Box onPointerUp={commitPaletteNow}>
                              <HexColorPicker
                                color={gradientStartColor}
                                onChange={onStartGradientColorChange}
                              />
                            </Box>
                          </VStack>
                          <VStack>
                            <HStack mb={3}>
                              <Text fontSize="xs">End color</Text>
                              <Box
                                w="20px"
                                h="20px"
                                bg={gradientEndColor}
                                border="1px solid"
                                borderColor="whiteAlpha.400"
                                flexShrink={0}
                              />
                              <HexColorInput
                                className="hexColorInput"
                                color={gradientEndColor}
                                onChange={onEndGradientColorChange}
                              />
                            </HStack>
                            <Box onPointerUp={commitPaletteNow}>
                              <HexColorPicker
                                color={gradientEndColor}
                                onChange={onEndGradientColorChange}
                              />
                            </Box>
                          </VStack>
                        </HStack>
                      </VStack>
                    </TabPanel>

                    <TabPanel px={0}>
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
                    </TabPanel>

                    <TabPanel px={0}>
                      <VStack alignItems="stretch" w="100%">
                        <LineChart
                          width={300}
                          height={100}
                          margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="t" type="number" hide />
                          <YAxis
                            type="number"
                            domain={[0, 1]}
                            hide
                            allowDataOverflow
                          />
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
                        <ManualPaletteEditor
                          palette={variation.palette}
                          setPalette={setPalette}
                        />
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
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
        width="5rem"
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
        <NumberInputField paddingInlineEnd={0} />
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
