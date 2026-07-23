import {
  Box,
  Button,
  Divider,
  HStack,
  Icon,
  Link,
  Select,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { TbClick } from "react-icons/tb";
import { Variation } from "@/src/types/Variations/Variation";
import { action } from "mobx";
import { FaTrashAlt } from "react-icons/fa";
import { BiDuplicate, BiLinkExternal } from "react-icons/bi";
import { Block } from "@/src/types/Block";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation } from "@/src/types/Variations/LinearVariation";
import {
  PeriodicVariation,
  PeriodicVariationType,
} from "@/src/types/Variations/PeriodicVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { HexColorPicker } from "react-colorful";
import { hexToRgb, vector4ToHex } from "@/src/utils/color";
import { HexColorInput } from "react-colorful";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";
import { useStore } from "@/src/types/StoreContext";
import { NumberParamInput } from "@/src/components/NumberParamInput";
import {
  EasingVariation,
  EasingVariationType,
} from "@/src/types/Variations/EasingVariation";
import { easings } from "@/src/utils/easings";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { PaletteVariationControls } from "@/src/params/palette/variation/VariationControls";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import { AudioVariationControls } from "@/src/components/VariationControls/AudioVariationControls";

type VariationControlsProps = {
  uniformName: string;
  variation: Variation;
  block: Block;
};

export const VariationControls = function VariationControls({
  uniformName,
  variation,
  block,
}: VariationControlsProps) {
  const store = useStore();

  const [duration, setDuration] = useState(variation.duration.toString());

  const controlsProps = { uniformName, block };
  const controls =
    variation instanceof FlatVariation ? (
      <FlatVariationControls variation={variation} {...controlsProps} />
    ) : variation instanceof LinearVariation ? (
      <LinearVariationControls variation={variation} {...controlsProps} />
    ) : variation instanceof PeriodicVariation ? (
      <PeriodicVariationControls variation={variation} {...controlsProps} />
    ) : variation instanceof SplineVariation ? (
      <SplineVariationControls variation={variation} {...controlsProps} />
    ) : variation instanceof EasingVariation ? (
      <EasingVariationControls variation={variation} {...controlsProps} />
    ) : variation instanceof AudioVariation ? (
      <AudioVariationControls variation={variation} {...controlsProps} />
    ) : variation instanceof LinearVariation4 ? (
      <LinearVariation4Controls variation={variation} {...controlsProps} />
    ) : variation instanceof PaletteVariation ? (
      <PaletteVariationControls variation={variation} {...controlsProps} />
    ) : (
      <Text>Needs implementation!</Text>
    );

  const parameterName = block.pattern.params[uniformName].name;

  return (
    <VStack p={1} bgColor="gray.700" fontSize={10} m={1} borderRadius={6}>
      <VStack spacing={0}>
        <Text fontWeight="bold">{parameterName}</Text>
        <Text>{variation.displayName} Variation</Text>
      </VStack>
      <VStack spacing={1}>
        {controls}
        <NumberParamInput
          name="Duration"
          onChange={(valueString, valueNumber) => {
            variation.duration = valueNumber;
            setDuration(valueString);
            block.triggerVariationReactions(uniformName);
          }}
          value={duration}
        />
      </VStack>
      <HStack spacing={0}>
        <Button
          aria-label="Duplicate"
          variant="ghost"
          size="xs"
          fontSize={8}
          color="gray.400"
          leftIcon={<BiDuplicate size={14} />}
          onClick={action(() =>
            store.duplicateVariation(block, uniformName, variation),
          )}
        >
          Duplicate
        </Button>
        <Button
          aria-label="Delete"
          variant="ghost"
          size="xs"
          fontSize={8}
          color="gray.400"
          leftIcon={<FaTrashAlt size={12} />}
          onClick={action(() =>
            store.deleteVariation(block, uniformName, variation),
          )}
        >
          Delete
        </Button>
      </HStack>
    </VStack>
  );
};

type FlatVariationControlsProps = {
  uniformName: string;
  variation: FlatVariation;
  block: Block;
};

function FlatVariationControls({
  uniformName,
  variation,
  block,
}: FlatVariationControlsProps) {
  const [value, setValue] = useState(variation.value.toString());

  return (
    <NumberParamInput
      name="Value"
      onChange={(valueString, valueNumber) => {
        variation.value = valueNumber;
        setValue(valueString);
        block.triggerVariationReactions(uniformName);
      }}
      value={value}
    />
  );
}

type LinearVariation4ControlsProps = {
  uniformName: string;
  variation: LinearVariation4;
  block: Block;
};

function LinearVariation4Controls({
  uniformName,
  variation,
  block,
}: LinearVariation4ControlsProps) {
  const [fromColor, setFromColor] = useState(vector4ToHex(variation.from));
  const [toColor, setToColor] = useState(vector4ToHex(variation.to));

  const onFromColorChange = (newHex: string) => {
    setFromColor(newHex);
    const rgb = hexToRgb(newHex);
    variation.from.set(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1);
    block.triggerVariationReactions(uniformName);
  };

  const onToColorChange = (newHex: string) => {
    setToColor(newHex);
    const rgb = hexToRgb(newHex);
    variation.to.set(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1);
    block.triggerVariationReactions(uniformName);
  };

  return (
    <VStack className="colorPickerContainer">
      <HStack width="100%" justify="space-around">
        <Box width={6} height={6} bgColor={fromColor} />
        <HexColorInput
          className="hexColorInput"
          color={fromColor}
          onChange={onFromColorChange}
        />
      </HStack>
      <HexColorPicker color={fromColor} onChange={onFromColorChange} />
      <HStack width="100%" justify="space-around">
        <Box width={6} height={6} bgColor={toColor} />
        <HexColorInput
          className="hexColorInput"
          color={toColor}
          onChange={onToColorChange}
        />
      </HStack>
      <HexColorPicker color={toColor} onChange={onToColorChange} />
    </VStack>
  );
}

type LinearVariationControlsProps = {
  uniformName: string;
  variation: LinearVariation;
  block: Block;
};

function LinearVariationControls({
  uniformName,
  variation,
  block,
}: LinearVariationControlsProps) {
  const [from, setFrom] = useState(variation.from.toString());
  const [to, setTo] = useState(variation.to.toString());

  return (
    <>
      <NumberParamInput
        name="From"
        onChange={(valueString, valueNumber) => {
          variation.from = valueNumber;
          setFrom(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={from}
      />
      <NumberParamInput
        name="To"
        onChange={(valueString, valueNumber) => {
          variation.to = valueNumber;
          setTo(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={to}
      />
    </>
  );
}

/** Idle gap (seconds) after which tap-tempo sequence resets. */
const PERIOD_TAP_TEMPO_RESET_SEC = 2;
const PERIOD_TAP_TEMPO_MAX_TAPS = 8;
const MIN_PERIOD_FROM_TAP_SEC = 0.01;

type PeriodicVariationControlsProps = {
  uniformName: string;
  variation: PeriodicVariation;
  block: Block;
  matchPeriodAndDuration?: boolean;
  onChange?: () => void;
};

const WAVE_TYPES: { type: PeriodicVariationType; label: string }[] = [
  { type: "sine", label: "Sine" },
  { type: "square", label: "Square" },
  { type: "triangle", label: "Triangle" },
];

// Small matching waveform glyphs, hand-drawn so all three share one stroke
// style (react-icons has no triangle-wave, and mixing weights looks off).
const WAVE_PATHS: Record<PeriodicVariationType, string> = {
  sine: "M1 8 Q 3.5 1 6 8 T 11 8 T 16 8",
  square: "M1 13 V3 H6 V13 H11 V3 H16",
  triangle: "M1 13 L4.5 3 L8 13 L11.5 3 L15 13",
};

function WaveGlyph({ type }: { type: PeriodicVariationType }) {
  return (
    <svg width="22" height="16" viewBox="0 0 17 16" fill="none" aria-hidden>
      <path
        d={WAVE_PATHS[type]}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A caption + hairline that visually fences a group of related inputs, so the
// range mode toggle reads as governing only the two inputs beneath it (not the
// timing fields further down).
function ControlSection({
  label,
  first,
  children,
}: {
  label: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <VStack spacing={1} align="stretch" w="100%">
      {!first && <Divider borderColor="whiteAlpha.300" />}
      <Text
        fontSize="8px"
        fontWeight={700}
        letterSpacing="0.08em"
        color="gray.500"
        textTransform="uppercase"
      >
        {label}
      </Text>
      {children}
    </VStack>
  );
}

// One button in a joined segmented control (rounded only on the outer edges).
function SegmentButton({
  active,
  first,
  last,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  first: boolean;
  last: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Button
      flex={1}
      size="xs"
      height="auto"
      py={1}
      px={1}
      variant={active ? "solid" : "outline"}
      colorScheme={active ? "blue" : "gray"}
      borderWidth="1px"
      borderColor={active ? "blue.400" : "whiteAlpha.300"}
      borderRadius={0}
      borderLeftRadius={first ? "md" : 0}
      borderRightRadius={last ? "md" : 0}
      ml={first ? 0 : "-1px"}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function PeriodicVariationControls({
  uniformName,
  variation,
  block,
  matchPeriodAndDuration,
  onChange,
}: PeriodicVariationControlsProps) {
  const periodTapTimesRef = useRef<number[]>([]);

  const [periodicType, setPeriodicType] = useState(variation.periodicType);
  const [amplitude, setAmplitude] = useState(variation.amplitude.toString());
  const [period, setPeriod] = useState(variation.period.toString());
  const [phase, setPhase] = useState(variation.phase.toString());
  const [offset, setOffset] = useState(variation.offset.toString());

  const [min, setMin] = useState(variation.min.toString());
  const [max, setMax] = useState(variation.max.toString());

  const [showingMinMax, setShowingMinMax] = useState(true);

  useEffect(() => {
    onChange?.();
  }, [periodicType, amplitude, period, phase, offset, min, max, onChange]);

  // Keep every local field in sync with the model. Called when flipping the
  // range mode so the newly-shown pair reflects the current wave, and so the
  // hidden pair is fresh when flipped back.
  const resyncRangeFields = () => {
    setAmplitude(variation.amplitude.toString());
    setOffset(variation.offset.toString());
    setMin(variation.min.toString());
    setMax(variation.max.toString());
  };

  const onTapPeriodTempo = () => {
    const nowSec = performance.now() / 1000;
    const times = periodTapTimesRef.current;
    const last = times[times.length - 1];
    if (last !== undefined && nowSec - last > PERIOD_TAP_TEMPO_RESET_SEC) {
      times.length = 0;
    }
    times.push(nowSec);
    while (times.length > PERIOD_TAP_TEMPO_MAX_TAPS) {
      times.shift();
    }
    if (times.length < 2) return;

    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i]! - times[i - 1]!);
    }
    const avgSec =
      intervals.reduce((sum, dt) => sum + dt, 0) / intervals.length;
    const nextPeriod = Math.max(MIN_PERIOD_FROM_TAP_SEC, avgSec);
    variation.period = nextPeriod;
    setPeriod(nextPeriod.toString());
    if (matchPeriodAndDuration) variation.duration = nextPeriod;
    block.triggerVariationReactions(uniformName);
  };

  return (
    <VStack spacing={2} align="stretch" w="100%">
      <ControlSection label="Waveform" first>
        <HStack spacing={0} w="100%">
          {WAVE_TYPES.map(({ type, label }, i) => (
            <SegmentButton
              key={type}
              active={periodicType === type}
              first={i === 0}
              last={i === WAVE_TYPES.length - 1}
              ariaLabel={label}
              onClick={() => {
                setPeriodicType(type);
                variation.periodicType = type;
                block.triggerVariationReactions(uniformName);
              }}
            >
              <VStack spacing={0}>
                <WaveGlyph type={type} />
                <Text fontSize="8px">{label}</Text>
              </VStack>
            </SegmentButton>
          ))}
        </HStack>
      </ControlSection>

      <ControlSection label="Range">
        <HStack spacing={0} w="100%">
          <SegmentButton
            active={showingMinMax}
            first
            last={false}
            onClick={() => {
              setShowingMinMax(true);
              resyncRangeFields();
            }}
          >
            <Text fontSize="9px">Min / Max</Text>
          </SegmentButton>
          <SegmentButton
            active={!showingMinMax}
            first={false}
            last
            onClick={() => {
              setShowingMinMax(false);
              resyncRangeFields();
            }}
          >
            <Text fontSize="9px">Offset / Amp</Text>
          </SegmentButton>
        </HStack>
        {showingMinMax ? (
          <>
            <NumberParamInput
              name="Min"
              onChange={(valueString, valueNumber) => {
                setMin(valueString);
                if (!isNaN(valueNumber)) {
                  variation.min = valueNumber;
                  block.triggerVariationReactions(uniformName);
                }
              }}
              value={min}
            />
            <NumberParamInput
              name="Max"
              onChange={(valueString, valueNumber) => {
                setMax(valueString);
                if (!isNaN(valueNumber)) {
                  variation.max = valueNumber;
                  block.triggerVariationReactions(uniformName);
                }
              }}
              value={max}
            />
          </>
        ) : (
          <>
            <NumberParamInput
              name="Offset"
              onChange={(valueString, valueNumber) => {
                variation.offset = valueNumber;
                setOffset(valueString);
                block.triggerVariationReactions(uniformName);
              }}
              value={offset}
            />
            <NumberParamInput
              name="Amplitude"
              onChange={(valueString, valueNumber) => {
                variation.amplitude = valueNumber;
                setAmplitude(valueString);
                block.triggerVariationReactions(uniformName);
              }}
              value={amplitude}
            />
          </>
        )}
      </ControlSection>

      <ControlSection label="Timing">
        <HStack spacing={1} w="100%" align="center">
          <Box flex={1}>
            <NumberParamInput
              name="Period"
              onChange={(valueString, valueNumber) => {
                // do not allow setting period to 0
                if (valueNumber) variation.period = valueNumber;
                setPeriod(valueString);
                if (matchPeriodAndDuration) variation.duration = valueNumber;
                block.triggerVariationReactions(uniformName);
              }}
              value={period}
            />
          </Box>
          <Tooltip
            label="Tap in rhythm to set the period — the period becomes the average time between your taps (resets after 2s idle)"
            openDelay={0}
            hasArrow
            placement="top"
            fontSize="xs"
          >
            <Button
              size="xs"
              variant="outline"
              leftIcon={<TbClick size={12} />}
              flexShrink={0}
              onClick={onTapPeriodTempo}
              aria-label="Tap to set period"
            >
              Tap
            </Button>
          </Tooltip>
        </HStack>
        <NumberParamInput
          name="Phase"
          onChange={(valueString, valueNumber) => {
            variation.phase = valueNumber;
            setPhase(valueString);
            block.triggerVariationReactions(uniformName);
          }}
          value={phase}
        />
      </ControlSection>
    </VStack>
  );
}

type SplineVariationControlsProps = {
  uniformName: string;
  variation: SplineVariation;
  block: Block;
};

function SplineVariationControls({
  uniformName,
  variation,
  block,
}: SplineVariationControlsProps) {
  const [min, setMin] = useState(variation.domainMin.toString());
  const [max, setMax] = useState(variation.domainMax.toString());

  return (
    <>
      <NumberParamInput
        name="Min"
        onChange={(valueString, valueNumber) => {
          variation.domainMin = valueNumber;
          setMin(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={min}
      />
      <NumberParamInput
        name="Max"
        onChange={(valueString, valueNumber) => {
          variation.domainMax = valueNumber;
          setMax(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={max}
      />
    </>
  );
}

type EasingVariationControlsProps = {
  uniformName: string;
  variation: EasingVariation;
  block: Block;
};

function EasingVariationControls({
  uniformName,
  variation,
  block,
}: EasingVariationControlsProps) {
  const [easingType, setEasingType] = useState<EasingVariationType>(
    variation.easingType,
  );
  const [from, setFrom] = useState(variation.from.toString());
  const [to, setTo] = useState(variation.to.toString());

  return (
    <>
      <Link href="https://easings.net/" isExternal>
        Easing reference <Icon as={BiLinkExternal} />
      </Link>
      <Select
        size="xs"
        value={easingType}
        onChange={(e) => {
          variation.easingType = e.target.value as EasingVariationType;
          setEasingType(variation.easingType);
          block.triggerVariationReactions(uniformName);
        }}
      >
        {Object.keys(easings).map((easingName) => (
          <option key={easingName} value={easingName}>
            {easingName}
          </option>
        ))}
      </Select>
      <NumberParamInput
        name="From"
        onChange={(valueString, valueNumber) => {
          variation.from = valueNumber;
          setFrom(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={from}
      />
      <NumberParamInput
        name="To"
        onChange={(valueString, valueNumber) => {
          variation.to = valueNumber;
          setTo(valueString);
          block.triggerVariationReactions(uniformName);
        }}
        value={to}
      />
    </>
  );
}
