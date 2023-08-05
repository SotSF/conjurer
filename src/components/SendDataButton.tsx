import { observer } from "mobx-react-lite";
import { IconButton } from "@chakra-ui/react";
import { CiStreamOn, CiStreamOff } from "react-icons/ci";
import { useStore } from "@/src/types/StoreContext";

export const SendDataButton = observer(function SendDataButton() {
  const store = useStore();

  return (
    <IconButton
      aria-label="Send data to canopy"
      title="Send data to canopy"
      height={6}
      bgColor={store.sendingData ? "orange.700" : undefined}
      _hover={
        store.sendingData
          ? {
              bgColor: "orange.600",
            }
          : undefined
      }
      icon={
        store.sendingData ? <CiStreamOn size={17} /> : <CiStreamOff size={17} />
      }
      onClick={store.toggleSendingData}
    />
  );
});
