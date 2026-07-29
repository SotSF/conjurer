import type { HoverHelp, UIStore } from "@/src/types/UIStore";
import { action } from "mobx";
import type { DOMAttributes } from "react";

/** Mouse enter/leave handlers that drive the status info bar. */
export function hoverHelpProps(
  uiStore: UIStore,
  title: string,
  description?: string,
): Pick<DOMAttributes<HTMLElement>, "onMouseEnter" | "onMouseLeave"> {
  const help: HoverHelp = description ? { title, description } : { title };
  return {
    onMouseEnter: action(() => uiStore.setHoverHelp(help)),
    onMouseLeave: action(() => uiStore.clearHoverHelp()),
  };
}
