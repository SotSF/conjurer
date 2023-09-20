import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import styles from "@/styles/TimeMarker.module.css";
import classNames from "classnames";
import { useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

export const PlayHead = observer(function PlayHead() {
  const store = useStore();
  const { audioStore, uiStore } = store;
  const { audioState } = audioStore;

  const playHead = useRef<HTMLDivElement>(null);

  const scrollIntoView = useDebouncedCallback(
    (scrollPosition: ScrollLogicalPosition) =>
      playHead.current?.scrollIntoView({
        behavior: "smooth",
        block: scrollPosition,
        inline: scrollPosition,
      }),
    20
  );

  useEffect(() => {
    if (!playHead.current || !uiStore.keepingPlayHeadVisible || !store.playing)
      return;

    const observer = new IntersectionObserver(
      ([entry]) => !entry.isIntersecting && scrollIntoView("start")
    );
    observer.observe(playHead.current);
    return () => observer.disconnect();
  }, [scrollIntoView, uiStore.keepingPlayHeadVisible, store.playing]);

  useEffect(() => {
    if (!uiStore.keepingPlayHeadCentered || !store.playing) return;

    const interval = setInterval(
      () => requestAnimationFrame(() => scrollIntoView("center")),
      30
    );
    return () => clearInterval(interval);
  }, [scrollIntoView, uiStore.keepingPlayHeadCentered, store.playing]);

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
  }, [audioStore.lastCursor, uiStore.pixelsPerSecond]);

  return (
    <Box
      ref={playHead}
      id="playhead"
      position="absolute"
      top={0}
      left={uiStore.timeToXPixels(audioStore.lastCursor.position)}
      className={classNames(styles.marker, {
        [styles.playing]: audioState === "playing",
      })}
      willChange="transform"
      overflowY="visible"
      zIndex={10}
      pointerEvents="none"
    >
      <Box
        position="absolute"
        top="0"
        left="150"
        bgColor="red"
        width="1px"
        height="200vh"
      />
    </Box>
  );
});
