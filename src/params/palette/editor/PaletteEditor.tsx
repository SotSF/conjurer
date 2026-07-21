import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from "@chakra-ui/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { PaletteVariation } from "../variation/PaletteVariation";
import { Block } from "@/src/types/Block";
import { Palette } from "../Palette";
import { PALETTE_PRESETS } from "../presets";
import { hexToVector3, vector3ToHex } from "@/src/utils/color";
import { Vector3 } from "three";

const samples = 100;
const LINEAR_GRADIENT_PHASE_SWEEP = Math.PI / 3;
const LINEAR_GRADIENT_PHASE_SIN = Math.sin(LINEAR_GRADIENT_PHASE_SWEEP / 2);
const COMMIT_DEBOUNCE_MS = 50;
const COMMIT_MAX_WAIT_MS = 100;

// CSS gradient sampled from the cosine palette, for previews / swatches
const paletteCss = (palette: Palette) => {
  const stops = Array.from({ length: 9 }, (_, i) => {
    const c = palette.colorAt(i / 8);
    return `rgb(${Math.round(c.x * 255)},${Math.round(c.y * 255)},${Math.round(
      c.z * 255,
    )}) ${Math.round((i / 8) * 100)}%`;
  });
  return `linear-gradient(90deg, ${stops.join(",")})`;
};

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

type PaletteEditorProps = {
  uniformName: string;
  variation: PaletteVariation;
  block: Block;
  setPalette?: (palette: Palette) => void;
};

export const PaletteEditor = function PaletteEditor({
  variation,
  setPalette,
}: PaletteEditorProps) {
  const palette = variation.palette;
  // palette is mutated in place; bump to re-render the previews after edits
  const [, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);

  const debouncedCommit = useDebouncedCallback(
    () => setPalette?.(palette),
    COMMIT_DEBOUNCE_MS,
    { maxWait: COMMIT_MAX_WAIT_MS, trailing: true },
  );

  const commit = useCallback(() => {
    rerender();
    debouncedCommit();
  }, [debouncedCommit]);

  const applyPreset = (preset: Palette) => {
    palette.a.copy(preset.a);
    palette.b.copy(preset.b);
    palette.c.copy(preset.c);
    palette.d.copy(preset.d);
    debouncedCommit.cancel();
    rerender();
    setPalette?.(palette);
  };

  const randomize = () => {
    palette.randomize();
    debouncedCommit.cancel();
    rerender();
    setPalette?.(palette);
  };

  const startHex = vector3ToHex(palette.colorAt(0));
  const endHex = vector3ToHex(palette.colorAt(1));
  const applyGradient = (start: string, end: string) => {
    setPaletteFromLinearGradient(palette, hexToVector3(start), hexToVector3(end));
    commit();
  };

  return (
    <VStack align="stretch" spacing={3} width="320px">
      <Box
        height="26px"
        borderRadius="4px"
        border="1px solid"
        borderColor="whiteAlpha.300"
        background={paletteCss(palette)}
      />

      <HStack justify="space-between">
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.300">
            Gradient
          </Text>
          <Input
            type="color"
            value={startHex}
            onChange={(e) => applyGradient(e.target.value, endHex)}
            width="28px"
            height="24px"
            p={0}
            border="none"
            cursor="pointer"
            title="Start color"
          />
          <Text fontSize="xs" color="gray.500">
            →
          </Text>
          <Input
            type="color"
            value={endHex}
            onChange={(e) => applyGradient(startHex, e.target.value)}
            width="28px"
            height="24px"
            p={0}
            border="none"
            cursor="pointer"
            title="End color"
          />
        </HStack>
        <Button size="xs" onClick={randomize}>
          Randomize
        </Button>
      </HStack>

      <Box>
        <Text fontSize="xs" color="gray.300" mb={1}>
          Presets
        </Text>
        <SimpleGrid columns={3} spacing={1}>
          {PALETTE_PRESETS.map((preset) => {
            const previewPalette = preset.make();
            return (
              <Tooltip key={preset.name} label={preset.name} openDelay={0}>
                <Box
                  height="20px"
                  borderRadius="3px"
                  cursor="pointer"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  background={paletteCss(previewPalette)}
                  onClick={() => applyPreset(previewPalette)}
                />
              </Tooltip>
            );
          })}
        </SimpleGrid>
      </Box>

      <Accordion allowToggle>
        <AccordionItem border="none">
          <AccordionButton px={1} py={1}>
            <Text fontSize="xs" color="gray.400">
              Advanced
            </Text>
            <AccordionIcon fontSize="sm" />
          </AccordionButton>
          <AccordionPanel px={0}>
            <RgbChart palette={palette} />
            <ManualPaletteEditor palette={palette} onChange={commit} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </VStack>
  );
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

const RgbChart = ({ palette }: { palette: Palette }) => {
  const series = getPaletteSeriesData(palette);
  return (
    <LineChart
      width={300}
      height={90}
      margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
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
      <RechartsTooltip isAnimationActive={false} content={<ColorValuesTooltip />} />
    </LineChart>
  );
};

const ManualPaletteEditor = ({
  palette,
  onChange,
}: {
  palette: Palette;
  onChange: () => void;
}) => (
  <TableContainer style={{ marginTop: 12 }}>
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
        {(["a", "b", "c", "d"] as const).map((component) => (
          <PaletteColorRow
            key={component}
            component={component}
            palette={palette}
            onChange={onChange}
          />
        ))}
      </Tbody>
    </Table>
  </TableContainer>
);

type PaletteComponent = "a" | "b" | "c" | "d";

const vectorAccessorMap = { r: "x", g: "y", b: "z" } as const;

const PaletteColorRow = ({
  component,
  palette,
  onChange,
}: {
  component: PaletteComponent;
  palette: Palette;
  onChange: () => void;
}) => {
  const data = palette[component];
  return (
    <Tr>
      <Td>{component.toUpperCase()}</Td>
      {(["r", "g", "b"] as const).map((channel) => (
        <PaletteColorComponent
          key={channel}
          data={data}
          channel={channel}
          onChange={onChange}
        />
      ))}
    </Tr>
  );
};

const PaletteColorComponent = ({
  data,
  channel,
  onChange,
}: {
  data: Vector3;
  channel: "r" | "g" | "b";
  onChange: () => void;
}) => {
  const accessor = vectorAccessorMap[channel];
  const [strValue, setStrValue] = useState(data[accessor].toFixed(5));
  return (
    <Td>
      <NumberInput
        size="sm"
        width="5rem"
        value={strValue}
        onChange={(valueString, valueNumber) => {
          setStrValue(valueString);
          if (!isNaN(valueNumber)) {
            data[accessor] = valueNumber;
            onChange();
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
