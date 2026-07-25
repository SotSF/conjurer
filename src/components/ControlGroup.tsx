import { HStack } from "@chakra-ui/react";
import { ReactNode } from "react";

type ControlGroupProps = {
  children: ReactNode;
};

export function ControlGroup({ children }: ControlGroupProps) {
  return (
    <HStack
      spacing={1}
      px={1.5}
      py={0.5}
      borderWidth={1}
      borderColor="gray.500"
      borderRadius="md"
      alignItems="center"
    >
      {children}
    </HStack>
  );
}
