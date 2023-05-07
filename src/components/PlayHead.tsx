import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { FaLongArrowAltDown } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import styles from "@/styles/TimeMarker.module.css";
import classNames from "classnames";
import { useEffect, useRef } from "react";

export const PlayHead = observer(function PlayHead() {
  const { timer, uiStore } = useStore();

  const playHead = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playHead.current) return;

    // This forces the animation to restart. https://css-tricks.com/restart-css-animation/
    playHead.current.style.animation = "none";
    void playHead.current.offsetHeight; // trigger reflow
    playHead.current.style.animation = "";

    // Account for the zoom level. The distance the playhead travels stays the same, 144000px.
    // The duration of the animation changes based on the zoom level.
    playHead.current.style.animationDuration = `${
      144000 / uiStore.pixelsPerSecond
    }s`;
  }, [timer.lastCursor, uiStore.pixelsPerSecond]);

  return (
    <Box
      ref={playHead}
      position="absolute"
      top={0}
      left={uiStore.timeToXPixels(timer.lastCursor.position)}
      className={classNames(styles.marker, { [styles.playing]: timer.playing })}
      willChange="transform"
      overflowY="visible"
      zIndex={10}
      pointerEvents="none"
    >
      <FaLongArrowAltDown
        style={{ position: "absolute", top: "14px", left: "-12px" }}
        size={25}
        color="red"
      />
      <Box
        position="absolute"
        top="40px"
        bgColor="red"
        width="1px"
        height="80vh"
      />
    </Box>
  );
});
