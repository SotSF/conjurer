import { Button, ButtonGroup } from "@chakra-ui/react";
import { memo } from "react";

export type ConnectedButtonOption<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string = string> = {
  options: readonly ConnectedButtonOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "xs" | "sm" | "md" | "lg";
  "aria-label"?: string;
};

function ConnectedButtonGroupInner<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
  "aria-label": ariaLabel,
}: Props<T>) {
  return (
    <ButtonGroup isAttached size={size} aria-label={ariaLabel} role="radiogroup">
      {options.map((opt, index) => {
        const isSelected = value === opt.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        return (
          <Button
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            // Keep border metrics identical across states to avoid layout shift.
            variant="outline"
            borderWidth="1px"
            borderStyle="solid"
            borderColor={isSelected ? "blue.500" : "gray.600"}
            borderRadius={0}
            borderTopLeftRadius={isFirst ? "md" : 0}
            borderBottomLeftRadius={isFirst ? "md" : 0}
            borderTopRightRadius={isLast ? "md" : 0}
            borderBottomRightRadius={isLast ? "md" : 0}
            onClick={() => onChange(opt.value)}
            bg={isSelected ? "blue.700" : "transparent"}
            color={isSelected ? "white" : "gray.100"}
            fontWeight={isSelected ? "semibold" : "normal"}
            _hover={{ bg: isSelected ? "blue.700" : "gray.800" }}
            _active={{ bg: isSelected ? "blue.700" : "gray.800" }}
            _focus={{ zIndex: 1 }}
          >
            {opt.label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}

export const ConnectedButtonGroup = memo(ConnectedButtonGroupInner) as typeof ConnectedButtonGroupInner;
