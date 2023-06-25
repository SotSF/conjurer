import { HStack } from "@chakra-ui/react";
import { memo } from "react";

export const HeaderRepeat = memo(function HeaderRepeat({
  times,
  children,
}: {
  times: number;
  children: React.ReactNode;
}) {
  return (
    <>
      {Array.from({ length: times }).map((_, i) => (
        <HStack key={i} justify="center" spacing={0} flexGrow={1}>
          {children}
        </HStack>
      ))}
    </>
  );
});
