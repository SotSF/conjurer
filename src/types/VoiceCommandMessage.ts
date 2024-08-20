type VoiceCommandConnectMessage = {
  type: "connect";
  appId: "conjurer";
};

export type VoiceCommandActionMessage = {
  type: "action";
} & { action: "togglePlay" | "goToBeginning" | "goToEnd" };

export type VoiceCommandMessage =
  | VoiceCommandConnectMessage
  | VoiceCommandActionMessage;
