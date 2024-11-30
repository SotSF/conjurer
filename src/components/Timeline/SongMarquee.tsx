import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import styles from "@/styles/SongMarquee.module.css";

export const SongMarquee = observer(function SongMarquee() {
  const { audioStore } = useStore();
  const { selectedSong } = audioStore;

  return (
    <Box position="relative" width="150px" height={5}>
      <Box
        position="absolute"
        boxSizing="border-box"
        left={0}
        top={0}
        className={styles.marquee}
        fontSize="sm"
        whiteSpace="nowrap"
      >
        {selectedSong.artist} - {selectedSong.name} . . . .{" "}
        {selectedSong.artist} - {selectedSong.name} . . . .
      </Box>
    </Box>
  );
});
