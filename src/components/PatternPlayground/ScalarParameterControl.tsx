import {
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
  Tooltip,
  VStack,
  useNumberInput,
} from "@chakra-ui/react";
import { useState } from "react";
import { Block } from "@/src/types/Block";
import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { runInAction } from "mobx";
import { ParameterControlName } from "@/src/components/PatternPlayground/ParameterControlName";
import { TbWaveSine } from "react-icons/tb";
import { MdTrendingFlat } from "react-icons/md";
import { PeriodicVariationControls } from "@/src/components/VariationControls/VariationControls";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { ScalarVariationGraph } from "@/src/components/VariationGraph/ScalarVariationGraph";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";

const labelStyles = {
  mt: -3,
  fontSize: "sm",
};

type ScalarParameterControlProps = {
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<number>;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const ScalarParameterControl = observer(function ScalarParameterControl({
  block,
  uniformName,
  patternParam,
  parameters,
  setParameters,
}: ScalarParameterControlProps) {
  const { playgroundStore } = useStore();
  const [variationMode, setVariationMode] = useState<"flat" | "periodic">(
    "flat"
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const min = typeof patternParam.min === "number" ? patternParam.min : 0;
  const max = typeof patternParam.max === "number" ? patternParam.max : 1;
  const step = typeof patternParam.step === "number" ? patternParam.step : 0.01;

  const [valueString, setValueString] = useState(patternParam.value.toString());
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
        inputNumber
      );
    });

    playgroundStore.sendControllerUpdateMessage();
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
          patternParam.value
        );
      else if (newVariationMode === "periodic")
        block.parameterVariations[uniformName]![0] = new PeriodicVariation(
          DEFAULT_VARIATION_DURATION,
          "sine",
          0,
          DEFAULT_VARIATION_DURATION,
          0,
          patternParam.value
        );
    });

    playgroundStore.sendControllerUpdateMessage();
  };

  const firstVariation = block.parameterVariations[uniformName]?.[0];

  const { getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
    step,
    value: valueString,
    onChange: updateParameterValue,
  });

  return (
    <HStack width="100%">
      <VStack width="150px" spacing={1} alignItems="flex-start">
        <HStack>
          <ParameterControlName patternParam={patternParam} />
          <IconButton
            size="xs"
            aria-label={variationMode === "flat" ? "Periodic" : "Flat"}
            title={variationMode === "flat" ? "Periodic" : "Flat"}
            height={6}
            icon={
              variationMode === "flat" ? (
                <TbWaveSine size={17} />
              ) : (
                <MdTrendingFlat size={17} />
              )
            }
            onClick={onVariationModeToggle}
          />
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
            <VStack>
              <PeriodicVariationControls
                uniformName={uniformName}
                block={block}
                variation={firstVariation}
                matchPeriodAndDuration
                onChange={playgroundStore.sendControllerUpdateMessage}
              />
            </VStack>
          )}
      </VStack>
      <VStack mx={12} flexGrow={1}>
        {variationMode === "flat" && (
          <Slider
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
            <SliderMark value={min} {...labelStyles} ml={-7}>
              {min}
            </SliderMark>
            <SliderMark value={max} {...labelStyles} ml={5}>
              {max}
            </SliderMark>
          </Slider>
        )}
        {variationMode === "periodic" &&
          firstVariation instanceof PeriodicVariation && (
            <ScalarVariationGraph
              uniformName={uniformName}
              block={block}
              variation={firstVariation}
              width={150}
              domain={firstVariation.computeDomain()}
            />
          )}
      </VStack>
    </HStack>
  );
});
