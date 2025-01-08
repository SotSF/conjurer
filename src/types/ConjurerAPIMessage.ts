import { Role } from "@/src/types/context";

export type ConjurerAPIStateMessage = {
  event: "conjurer_state_update";
  data: {
    browser_tab_state: "connected" | "disconnected";
    modes_available: Role[];
    current_mode: {
      name: Role;
      // TODO:
      commands: any[];
    } | null;
  };
};

export type ConjurerAPISelectModeMessage = {
  event: "select_mode";
  data: {
    mode: Role;
  };
};

export type ConjurerAPICommandMessage = {
  event: "command";
  data: {
    // TODO:
    command: string;
  };
};

export type ConjurerAPIMessage =
  | ConjurerAPIStateMessage
  | ConjurerAPISelectModeMessage
  | ConjurerAPICommandMessage;
