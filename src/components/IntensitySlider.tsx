import { observer } from "mobx-react-lite";
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Tooltip,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useState } from "react";

export const IntensitySlider = observer(function IntensitySlider() {
  const store = useStore();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Slider
      id="slider"
      width="120px"
      value={store.globalIntensity}
      min={0}
      max={1}
      step={0.01}
      colorScheme="teal"
      onChange={action((v) => (store.globalIntensity = v))}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
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
  );
});
