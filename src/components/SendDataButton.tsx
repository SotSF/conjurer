import { observer } from "mobx-react-lite";
import { Button } from "@chakra-ui/react";
import { CiStreamOn, CiStreamOff } from "react-icons/ci";
import { useStore } from "@/src/types/StoreContext";

export const SendDataButton = observer(function SendDataButton() {
  const store = useStore();

  if (process.env.NEXT_PUBLIC_NODE_ENV === "production") return null;

  return (
    <Button
      size="sm"
      bgColor={store.sendingData ? "orange.700" : undefined}
      _hover={
        store.sendingData
          ? {
              bgColor: "orange.600",
            }
          : undefined
      }
      leftIcon={
        store.sendingData ? <CiStreamOn size={17} /> : <CiStreamOff size={17} />
      }
      onClick={store.toggleSendingData}
    >
      {store.sendingData ? "Sending" : "Send Data"}
    </Button>
  );
});
