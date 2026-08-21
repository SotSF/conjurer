import { IconButton } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MdBlurOn } from "react-icons/md";
import { EffectTrack } from "@/src/types/EffectTrack";
import { useStore } from "@/src/types/StoreContext";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

type Props = {
  track: EffectTrack;
  label: string;
  helpTitle: string;
  helpDescription: string;
};

// Toggles a track's editor-only bypass: its effects drop out of the signal
// path without being deleted.
export const TrackBypassButton = observer(function TrackBypassButton({
  track,
  label,
  helpTitle,
  helpDescription,
}: Props) {
  const { uiStore } = useStore();
  return (
    <IconButton
      minW="20px"
      w="20px"
      h="20px"
      variant="unstyled"
      color={track.visible ? "blue.600" : "gray.600"}
      display="flex"
      alignItems="center"
      justifyContent="center"
      aria-label={label}
      title={label}
      icon={<MdBlurOn size={15} />}
      onClick={action((e) => {
        track.toggleVisible();
        e.stopPropagation();
      })}
      {...hoverHelpProps(uiStore, helpTitle, helpDescription)}
    />
  );
});
