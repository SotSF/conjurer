import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import styles from "@/styles/SongMarquee.module.css";

export const SongMarquee = observer(function SongMarquee() {
  const { audioStore } = useStore();
  const { selectedSong } = audioStore;
  const label = `${selectedSong.artist} - ${selectedSong.name}`;
  // Keep a steady pixel speed so long titles don't whip by.
  const durationSeconds = Math.max(8, label.length * 0.35);

  return (
    <Box
      key={selectedSong.id}
      position="relative"
      width="100%"
      height={5}
      flexShrink={0}
      overflow="hidden"
      userSelect="none"
    >
      <Box
        className={styles.track}
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        <Box as="span" className={styles.item} fontSize="sm">
          {label}
        </Box>
        <Box as="span" className={styles.item} fontSize="sm" aria-hidden>
          {label}
        </Box>
      </Box>
    </Box>
  );
});
