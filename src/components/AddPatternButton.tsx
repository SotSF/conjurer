import { Box, Button } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AiOutlinePlus } from "react-icons/ai";
import { observer } from "mobx-react-lite";

export const AddPatternButton = observer(function AddPatternButton() {
  const store = useStore();
  const { uiStore } = store;

  const placement = { [uiStore.horizontalLayout ? "right" : "left"]: 0 };
  return (
    <Box position="absolute" bottom={0} {...placement} m={4}>
      <Button
        variant="solid"
        bgColor="gray.600"
        fontWeight="bold"
        borderRadius="50%"
        onClick={action(() => {
          uiStore.patternDrawerOpen = true;
        })}
      >
        <AiOutlinePlus />
      </Button>
    </Box>
  );
});
