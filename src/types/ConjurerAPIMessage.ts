import { Role } from "@/src/types/context";

export type CommandSpec =
  | { name: CommandNoParams; params: [] }
  | {
      name: CommandUpdateParameter;
      params: [{ name: "string"; value: "number" }];
    }
  | {
      name: CommandAddRemoveEffect;
      params: [{ name: "string" }];
    };

export type ExtraStateData = Partial<{
  patterns_available: string[];
  effects_available: string[];
  current_pattern: {
    name: string;
    params: Record<string, { name: string; value: number }>;
  };
}>;
export type ConjurerAPIStateMessage = {
  event: "conjurer_state_update";
  data: {
    browser_tab_state: "connected" | "disconnected";
    modes_available: Role[];
    current_mode:
      | ({
          name: Role;
          commands: CommandSpec[];
        } & ExtraStateData)
      | null;
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

type CommandNoParams =
  | "toggle_send_data"
  | "next_track"
  | "previous_track"
  | "toggle_playing"
  | "shuffle"
  | "loop_all"
  | "restart"
  | "next_pattern"
  | "previous_pattern";
type CommandUpdateParameter = "update_parameter";
type CommandAddRemoveEffect = "add_effect" | "remove_effect";

export type ConjurerAPICommandMessage = {
  event: "command";
  data:
    | {
        command: CommandNoParams;
      }
    | {
        command: CommandUpdateParameter;
        params: { name: string; value: number }[];
      }
    | { command: CommandAddRemoveEffect; params: { name: string }[] };
};

export type ConjurerAPIMessage =
  | ConjurerAPIStateMessage
  | ConjurerAPIRequestStateMessage
  | ConjurerAPISelectModeMessage
  | ConjurerAPICommandMessage;
