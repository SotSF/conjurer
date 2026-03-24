import { Box, HStack, Kbd, Text, VStack } from "@chakra-ui/react";
import { Fragment, memo } from "react";

type Row = {
  /** Key labels shown as separate `<Kbd>` chips; `joiner` is between consecutive keys. */
  keyParts: string[];
  joiner?: string;
  description: string;
};

const ROWS: Row[] = [
  { keyParts: ["d"], description: "Toggle delete preset mode" },
  {
    keyParts: ["Shift", "X"],
    joiner: "+",
    description: "Crossfade preview to live",
  },
  { keyParts: ["v"], description: "Switch between editing live and preview" },
  {
    keyParts: ["←", "→", "↑", "↓"],
    joiner: " ",
    description: "Previous / next pattern (when not typing in a field)",
  },
  {
    keyParts: ["Home", "End"],
    joiner: "·",
    description: "First / last pattern (when not typing in a field)",
  },
];

function KeyChips({ keyParts, joiner = " " }: Pick<Row, "keyParts" | "joiner">) {
  return (
    <HStack spacing={1} flexWrap="wrap" justify="flex-end">
      {keyParts.map((part, i) => (
        <Fragment key={`${part}-${i}`}>
          {i > 0 && (
            <Text as="span" fontSize="xs" color="gray.500" px={0.5}>
              {joiner}
            </Text>
          )}
          <Kbd fontSize="xs">{part}</Kbd>
        </Fragment>
      ))}
    </HStack>
  );
}

export const VJKeyboardShortcutsHelp = memo(function VJKeyboardShortcutsHelp() {
  return (
    <Box w="100%" mt={2} pt={2} borderTopWidth="1px" borderColor="gray.600">
      <Box maxW="lg" w="100%" mx="auto">
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="gray.400"
          mb={2}
          textAlign="center"
        >
          Keyboard shortcuts
        </Text>
        <VStack align="stretch" spacing={1.5}>
          {ROWS.map((row) => (
            <HStack
              key={row.description}
              align="flex-start"
              spacing={3}
              fontSize="xs"
              color="gray.300"
            >
              <Box flex="0 0 42%" maxW="200px">
                <KeyChips keyParts={row.keyParts} joiner={row.joiner} />
              </Box>
              <Text flex="1" minW={0}>
                {row.description}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
});
