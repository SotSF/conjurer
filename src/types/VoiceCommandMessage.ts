export type VoiceCommandMessage =
  | {
      type: "connect";
      appId: "conjurer";
    }
  | { type: "action" };
