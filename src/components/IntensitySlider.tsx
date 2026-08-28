import { observer } from "mobx-react-lite";
import {
  HStack,
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Tooltip,
} from "@chakra-ui/react";
import { FaSun } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useState } from "react";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

export const IntensitySlider = observer(function IntensitySlider() {
  const store = useStore();
  const { uiStore } = store;
  const [showTooltip, setShowTooltip] = useState(false);
  const intensityOff = store.globalIntensity === 0;

  return (
    <HStack spacing={0} alignItems="center">
      <IconButton
        aria-label={
          intensityOff ? "Restore output intensity" : "Blackout output intensity"
        }
        title={
          intensityOff ? "Restore output intensity" : "Blackout output intensity"
        }
        variant="ghost"
        height={6}
        minW={6}
        icon={<FaSun size={17} />}
        color={intensityOff ? "orange.300" : undefined}
        onClick={action(() => {
          store.globalIntensity = intensityOff ? 1 : 0;
        })}
        {...hoverHelpProps(
          uiStore,
          "Toggle output intensity",
          "Switch master brightness between full and off.",
        )}
      />
      <Slider
        id="slider"
        aria-label="Output intensity"
        title="Output intensity"
        mx={1}
        width="120px"
        value={store.globalIntensity}
        min={0}
        max={1}
        step={0.01}
        colorScheme="teal"
        onChange={action((v) => (store.globalIntensity = v))}
        onMouseEnter={action(() => {
          setShowTooltip(true);
          uiStore.setHoverHelp({
            title: "Output intensity",
            description:
              "Master brightness for the rendered canopy output. Live operator control — not saved with the experience.",
          });
        })}
        onMouseLeave={action(() => {
          setShowTooltip(false);
          uiStore.clearHoverHelp();
        })}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
        <Tooltip
          hasArrow
          bg="teal.500"
          color="white"
          placement="top"
          isOpen={showTooltip}
          label={`Output intensity: ${(store.globalIntensity * 100).toFixed(0)}%`}
        >
          <SliderThumb />
        </Tooltip>
      </Slider>
    </HStack>
  );
});
