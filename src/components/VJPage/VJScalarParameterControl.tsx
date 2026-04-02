import {
  Box,
  Button,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
  Tooltip,
  VStack,
  useNumberInput,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Block } from "@/src/types/Block";
import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { DEFAULT_PERIOD, DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { runInAction } from "mobx";
import { FaTimes } from "react-icons/fa";
import { TbWaveSine } from "react-icons/tb";
import { PeriodicVariationControls } from "@/src/components/VariationControls/VariationControls";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { ScalarVariationGraph } from "@/src/components/VariationGraph/ScalarVariationGraph";
import { observer } from "mobx-react-lite";
import { VJParameterControlName } from "@/src/components/VJPage/VJParameterControlName";

const labelStyles = {
  mt: -3,
  fontSize: "sm",
};
// Reserve horizontal space for min/max labels; keep modest so the edit pane does not overflow.
const sliderSideSpace = 0; // Chakra spacing token (each side of slider column)
const sliderLabelGap = 6; // gap between track ends and numeric labels
const sliderMarkMinW = "72px"; // min width for min/max labels (decimals)
/** Horizontal inset so min/max marks (which sit outside the track) stay visible without overflow clipping. */
const sliderMarkHorizontalGutter = 16; // Chakra space token (~4rem)

type VJScalarParameterControlProps = {
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<number>;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const VJScalarParameterControl = observer(
  function VJScalarParameterControl({
    block,
    uniformName,
    patternParam,
    parameters,
    setParameters,
  }: VJScalarParameterControlProps) {
    const variations = block.parameterVariations[uniformName] ?? [];

    const [variationMode, setVariationMode] = useState<"flat" | "periodic">(
      variations.length > 0 && variations[0].type === "periodic"
        ? "periodic"
        : "flat",
    );

    const [showTooltip, setShowTooltip] = useState(false);
    const min = typeof patternParam.min === "number" ? patternParam.min : 0;
    const max = typeof patternParam.max === "number" ? patternParam.max : 1;
    const step =
      typeof patternParam.step === "number" ? patternParam.step : 0.01;

    const [valueString, setValueString] = useState(
      patternParam.value.toString(),
    );

    useEffect(() => {
      setValueString(patternParam.value.toString());
    }, [patternParam]);

    const updateParameterValue = (inputString: string, inputNumber: number) => {
      setValueString(inputString);

      if (Number.isNaN(inputNumber)) return;

      setParameters({ ...parameters, [uniformName]: inputNumber });
      patternParam.value = inputNumber;

      runInAction(() => {
        // Also insert a variation so that this parameter value is serializable
        if (!block.parameterVariations[uniformName])
          block.parameterVariations[uniformName] = [];

        block.parameterVariations[uniformName]![0] = new FlatVariation(
          DEFAULT_VARIATION_DURATION,
          inputNumber,
        );
      });
    };

    const onVariationModeToggle = () => {
      const newVariationMode = variationMode === "flat" ? "periodic" : "flat";
      setVariationMode(newVariationMode);

      runInAction(() => {
        // Also insert a variation
        if (!block.parameterVariations[uniformName])
          block.parameterVariations[uniformName] = [];

        if (newVariationMode === "flat")
          block.parameterVariations[uniformName]![0] = new FlatVariation(
            DEFAULT_VARIATION_DURATION,
            patternParam.value,
          );
        else if (newVariationMode === "periodic")
          block.parameterVariations[uniformName]![0] = new PeriodicVariation(
            DEFAULT_VARIATION_DURATION,
            "sine",
            0,
            DEFAULT_PERIOD,
            0,
            patternParam.value,
          );
      });
    };

    const firstVariation = block.parameterVariations[uniformName]?.[0];

    const { getIncrementButtonProps, getDecrementButtonProps } = useNumberInput(
      {
        step,
        value: valueString,
        onChange: updateParameterValue,
      },
    );

    return (
      <HStack width="100%" maxW="100%" minW={0} alignItems="center" spacing={4}>
        <VStack
          flex="0 1 200px"
          minW="120px"
          maxW="200px"
          w="100%"
          spacing={1}
          alignItems="flex-start"
          overflow="hidden"
        >
          <HStack w="100%" minW={0} spacing={1} alignItems="flex-start">
            <Box flex="1" minW={0}>
              <VJParameterControlName patternParam={patternParam} />
            </Box>
            {variationMode === "flat" ? (
              <IconButton
                flexShrink={0}
                size="xs"
                aria-label="Periodic variation"
                title="Vary this parameter periodically"
                height={6}
                icon={<TbWaveSine size={17} />}
                onClick={onVariationModeToggle}
              />
            ) : (
              <IconButton
                flexShrink={0}
                size="xs"
                aria-label="Constant value"
                title="Set this parameter to a constant value"
                height={6}
                icon={<FaTimes size={14} />}
                onClick={onVariationModeToggle}
              />
            )}
          </HStack>
          {variationMode === "flat" && (
            <HStack spacing={0}>
              <Button
                size="xs"
                borderTopRightRadius={0}
                borderBottomRightRadius={0}
                {...getDecrementButtonProps()}
              >
                -
              </Button>
              <NumberInput
                size="xs"
                step={step}
                onChange={updateParameterValue}
                value={valueString}
              >
                <NumberInputField
                  fontSize="md"
                  textAlign="center"
                  fontWeight="bold"
                  padding={0}
                />
              </NumberInput>
              <Button
                size="xs"
                borderTopLeftRadius={0}
                borderBottomLeftRadius={0}
                {...getIncrementButtonProps()}
              >
                +
              </Button>
            </HStack>
          )}
          {variationMode === "periodic" &&
            firstVariation instanceof PeriodicVariation && (
              <VStack align="stretch" spacing={1} w="100%" minW={0}>
                {patternParam.jumpy && (
                  <Text fontSize="xs" color="orange.300" lineHeight="short">
                    Varying this parameter over time might result in jumpy
                    visuals!
                  </Text>
                )}
                <VStack fontSize={12} width={40}>
                  <PeriodicVariationControls
                    uniformName={uniformName}
                    block={block}
                    variation={firstVariation}
                    matchPeriodAndDuration
                  />
                </VStack>
              </VStack>
            )}
        </VStack>

        {variationMode === "flat" && (
          <VStack
            flex="1"
            minW={0}
            maxW="100%"
            alignSelf="stretch"
            justifyContent="center"
            py={1}
            pl={2}
            mx={sliderSideSpace}
            overflow="visible"
          >
            <Box
              w="100%"
              minW={0}
              px={sliderMarkHorizontalGutter}
              overflow="visible"
            >
              <Slider
                w="100%"
                overflow="visible"
                min={min}
                max={max}
                step={step}
                value={patternParam.value}
                onChange={(inputNumber) =>
                  updateParameterValue(inputNumber.toString(), inputNumber)
                }
                focusThumbOnChange={false}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <Tooltip
                  hasArrow
                  bg="blue.300"
                  color="white"
                  placement="top"
                  isOpen={showTooltip}
                  label={patternParam.value}
                >
                  <SliderThumb boxSize={5} />
                </Tooltip>
                <SliderMark
                  value={min}
                  {...labelStyles}
                  ml={0}
                  textAlign="right"
                  minW={sliderMarkMinW}
                  whiteSpace="nowrap"
                  transform="translateX(calc(-100% - 1.5rem))"
                >
                  {min}
                </SliderMark>
                <SliderMark
                  value={max}
                  {...labelStyles}
                  ml={sliderLabelGap}
                  textAlign="left"
                  minW={sliderMarkMinW}
                  whiteSpace="nowrap"
                >
                  {max}
                </SliderMark>
              </Slider>
            </Box>
          </VStack>
        )}

        {variationMode === "periodic" &&
          firstVariation instanceof PeriodicVariation && (
            <VStack fontSize="small" ml={4} alignSelf="center">
              <ScalarVariationGraph
                uniformName={uniformName}
                block={block}
                variation={firstVariation}
                width={150}
                domain={firstVariation.computeDomain()}
              />
            </VStack>
          )}
      </HStack>
    );
  },
);
