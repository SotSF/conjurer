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

export type ConjurerAPIRequestStateMessage = {
  event: "request_state";
};

export type ConjurerAPISelectModeMessage = {
  event: "select_mode";
  data: {
    mode: Role;
  };
};

export type ConjurerAPICommandMessage = {
  event: "command";
  data:
    | {
        command:
          | "toggle_send_data"
          | "next_track"
          | "previous_track"
          | "toggle_playing"
          | "shuffle"
          | "loop_all"
          | "restart"
          | "next_pattern"
          | "previous_pattern";
      }
    | {
        command: "update_parameter";
        params: { name: string; value: number }[];
      }
    | { command: "add_effect" | "remove_effect"; params: { name: string }[] };
};

export type ConjurerAPIMessage =
  | ConjurerAPIStateMessage
  | ConjurerAPIRequestStateMessage
  | ConjurerAPISelectModeMessage
  | ConjurerAPICommandMessage;
