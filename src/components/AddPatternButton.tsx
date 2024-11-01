import { Box, Button } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AiOutlinePlus } from "react-icons/ai";
import { observer } from "mobx-react-lite";

export const AddPatternButton = observer(function AddPatternButton() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <Box position="absolute" bottom={0} right={0} m={4}>
      <Button
        variant="solid"
        bgColor="gray.600"
        fontWeight="bold"
        borderRadius="50%"
        onClick={action(() => {
          store.pause();
          uiStore.patternDrawerOpen = true;
        })}
        zIndex={100}
      >
        <AiOutlinePlus />
      </Button>
    </Box>
  );
});
