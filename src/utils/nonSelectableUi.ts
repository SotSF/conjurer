import type { SystemStyleObject } from "@chakra-ui/react";

/**
 * Disable text selection on interactive editor chrome (blocks, lanes, device /
 * parameter panels). Form fields re-enable selection so values stay editable.
 */
export const nonSelectableUiProps = {
  userSelect: "none" as const,
  sx: {
    "input, textarea, [contenteditable='true']": {
      userSelect: "text",
    },
  } satisfies SystemStyleObject,
};
