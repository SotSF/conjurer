import { IconButton, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { FaDotCircle } from "react-icons/fa";
import { TbLayoutRows, TbLayoutColumns } from "react-icons/tb";
import { TbRectangleFilled } from "react-icons/tb";
import { AiOutlineLineChart } from "react-icons/ai";

export const DisplayControls = observer(function DisplayControls() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <VStack
      p={2}
      position="absolute"
      bottom={2}
      right={1}
      alignItems="flex-start"
      zIndex={1}
    >
      <IconButton
        aria-label="Toggle horizontal/vertical layout"
        title="Toggle horizontal/vertical layout"
        height={6}
        icon={
          uiStore.horizontalLayout ? (
            <TbLayoutColumns size={17} />
          ) : (
            <TbLayoutRows size={17} />
          )
        }
        onClick={action(() => uiStore.toggleLayout())}
      />
      <IconButton
        aria-label="Toggle canopy view"
        title="Toggle canopy view"
        height={6}
        icon={
          uiStore.displayingCanopy ? (
            <TbRectangleFilled size={17} />
          ) : (
            <FaDotCircle size={17} />
          )
        }
        onClick={action(() => uiStore.toggleCanopyDisplay())}
      />
      <IconButton
        aria-label="Toggle performance"
        title="Toggle performance"
        height={6}
        icon={<AiOutlineLineChart size={17} />}
        onClick={action(() => uiStore.togglePerformance())}
      />
    </VStack>
  );
});
