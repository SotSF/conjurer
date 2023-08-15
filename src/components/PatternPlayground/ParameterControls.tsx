import { Button, Heading, VStack } from "@chakra-ui/react";
import { memo, useEffect, useState } from "react";
import { Block } from "@/src/types/Block";
import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import { ParameterControl } from "@/src/components/PatternPlayground/ParameterControl";
import { sendControllerMessage } from "@/src/utils/controllerWebsocket";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";

type ParameterControlsProps = {
  block: Block<ExtraParams>;
};

export const ParameterControls = observer(function ParameterControls({
  block,
}: ParameterControlsProps) {
  const store = useStore();
  const { context, playgroundStore } = store;
  const { selectedPatternBlock } = playgroundStore;
  const [parameters, setParameters] = useState({});
  const [showControls, toggleControls] = useState(true);

  // TODO: will also send a message when the selected pattern block changes, which is redundant with
  // another call
  useEffect(() => {
    if (context === "controller")
      sendControllerMessage({
        type: "updateBlock",
        transferBlock: selectedPatternBlock.serializeTransferBlock(),
      });
  }, [context, parameters, selectedPatternBlock]);

  const isEffect = block.parentBlock !== null;
  return (
    <VStack
      spacing={0}
      width="100%"
      borderStyle="solid"
      borderWidth={1}
      borderColor="black"
    >
      <Heading size="sm">
        {isEffect ? "Effect:" : "Pattern:"} {block.pattern.name}
        <Button
          ml={1}
          variant="unstyled"
          onClick={() => toggleControls(!showControls)}
        >
          {showControls ? <BsArrowsCollapse /> : <BsArrowsExpand />}
        </Button>
      </Heading>

      {showControls &&
        Object.entries<PatternParam>(block.pattern.params).map(
          ([uniformName, patternParam]) => (
            <ParameterControl
              key={uniformName}
              block={block}
              uniformName={uniformName}
              patternParam={patternParam}
              parameters={parameters}
              setParameters={setParameters}
            />
          )
        )}
    </VStack>
  );
});
