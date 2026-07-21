import { observer } from "mobx-react-lite";
import {
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Tooltip,
} from "@chakra-ui/react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useState } from "react";
import { ControlGroup } from "@/src/components/ControlGroup";
import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import {
  MAX_PIXELS_PER_SECOND,
  MIN_PIXELS_PER_SECOND,
} from "@/src/types/UIStore";

const LOG_MIN = Math.log(MIN_PIXELS_PER_SECOND);
const LOG_MAX = Math.log(MAX_PIXELS_PER_SECOND);

/** Map pixels/sec onto a 0–1 log scale so the slider feels evenly zoomed. */
const ppsToSlider = (pps: number) =>
  (Math.log(pps) - LOG_MIN) / (LOG_MAX - LOG_MIN);

const sliderToPps = (t: number) => Math.exp(LOG_MIN + t * (LOG_MAX - LOG_MIN));

export const ZoomControls = observer(function ZoomControls() {
  const store = useStore();
  const { uiStore } = store;
  const [showTooltip, setShowTooltip] = useState(false);

  const zoomPercent = Math.round(
    (uiStore.pixelsPerSecond / INITIAL_PIXELS_PER_SECOND) * 100,
  );

  return (
    <ControlGroup>
      <IconButton
        aria-label="Zoom out"
        title="Zoom out"
        variant="ghost"
        height={6}
        minW={6}
        icon={<FaMinus size={12} />}
        onClick={action(() => uiStore.zoomOut())}
        isDisabled={uiStore.pixelsPerSecond <= MIN_PIXELS_PER_SECOND}
      />
      <Slider
        aria-label="Timeline zoom"
        title="Timeline zoom"
        mx={1}
        width="120px"
        min={0}
        max={1}
        step={0.01}
        value={ppsToSlider(uiStore.pixelsPerSecond)}
        onChange={action((t) => uiStore.setZoom(sliderToPps(t)))}
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
          label={`Zoom: ${zoomPercent}%`}
        >
          <SliderThumb />
        </Tooltip>
      </Slider>
      <IconButton
        aria-label="Zoom in"
        title="Zoom in"
        variant="ghost"
        height={6}
        minW={6}
        icon={<FaPlus size={12} />}
        onClick={action(() => uiStore.zoomIn())}
        isDisabled={uiStore.pixelsPerSecond >= MAX_PIXELS_PER_SECOND}
      />
    </ControlGroup>
  );
});
