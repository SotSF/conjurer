import { HStack, Text } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";

export const STATUS_INFO_BAR_HEIGHT = 22;

const DEFAULT_HELP =
  "Hover a control for a description · Space plays/pauses · ⌃+scroll zooms the timeline";

/**
 * Thin Ableton-style status strip at the bottom of the arrangement.
 * Updates live from uiStore.hoverHelp as the pointer moves over controls.
 */
export const StatusInfoBar = observer(function StatusInfoBar() {
  const { uiStore } = useStore();
  const help = uiStore.hoverHelp;

  return (
    <HStack
      height={`${STATUS_INFO_BAR_HEIGHT}px`}
      px={3}
      spacing={2}
      bg="#12151c"
      borderTopWidth="1px"
      borderColor="#2d3748"
      overflow="hidden"
      align="center"
      flexShrink={0}
    >
      {help ? (
        <>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.200"
            flexShrink={0}
            noOfLines={1}
          >
            {help.title}
          </Text>
          {help.description && (
            <Text fontSize="xs" color="gray.400" noOfLines={1}>
              {help.description}
            </Text>
          )}
        </>
      ) : (
        <Text fontSize="xs" color="gray.500" noOfLines={1}>
          {DEFAULT_HELP}
        </Text>
      )}
    </HStack>
  );
});
