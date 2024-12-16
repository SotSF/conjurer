import { Box, Button } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AiOutlinePlus } from "react-icons/ai";
import { observer } from "mobx-react-lite";

export const AddPatternButton = observer(function AddPatternButton() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <Box position="absolute" bottom={0} right={0} m={6}>
      <Button
        variant="solid"
        bgColor="orange.500"
        _hover={{ backgroundColor: "orange.400" }}
        size="md"
        borderRadius={"full"}
        onClick={action(() => {
          store.pause();
          uiStore.patternDrawerOpen = true;
        })}
        zIndex={100}
        leftIcon={<AiOutlinePlus size={18} />}
      >
        Pattern
      </Button>
    </Box>
  );
});
