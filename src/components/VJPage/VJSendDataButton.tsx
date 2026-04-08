import { Button } from "@chakra-ui/react";
import { CiStreamOn, CiStreamOff } from "react-icons/ci";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import {
  VJ_LIVE_ACCENT_IDLE,
  VJ_LIVE_ACCENT_SENDING,
  VJ_LIVE_SENDING_BUTTON_BG,
  vjLiveAccentHover,
} from "@/src/components/VJPage/vjLiveTheme";

export const VJSendDataButton = observer(function VJSendDataButton() {
  const store = useStore();

  if (process.env.NEXT_PUBLIC_NODE_ENV === "production") return null;

  const sending = store.sendingData;
  const hover = vjLiveAccentHover(sending);

  return (
    <Button
      mt={1}
      size="sm"
      variant="solid"
      bg={sending ? VJ_LIVE_SENDING_BUTTON_BG : VJ_LIVE_ACCENT_IDLE}
      color={sending ? "white" : "black"}
      borderWidth="1px"
      borderStyle="solid"
      borderColor={sending ? VJ_LIVE_ACCENT_SENDING : VJ_LIVE_ACCENT_IDLE}
      _hover={{
        bg: sending ? "red.600" : "blue.200",
        borderColor: sending ? "red.500" : hover,
        color: sending ? "white" : "black",
      }}
      _active={{
        bg: sending ? "red.700" : "blue.400",
      }}
      leftIcon={
        sending ? <CiStreamOn size={17} /> : <CiStreamOff size={17} />
      }
      onClick={store.toggleSendingData}
    >
      {sending ? "Sending" : "Send Data"}
    </Button>
  );
});
