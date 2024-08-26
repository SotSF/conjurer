import { Store } from "@/src/types/Store";
import { VoiceCommandMessage } from "@/src/types/VoiceCommandMessage";
import { handleVoiceCommandActionMessage } from "@/src/websocket/voiceCommandHandler";
import {
  VOICE_COMMAND_APP_WEBSOCKET_HOST,
  VOICE_COMMAND_APP_WEBSOCKET_PORT,
} from "@/src/websocket/websocketHost";

let _websocket: WebSocket;

export const setupVoiceCommandWebsocket = (store: Store) => {
  console.log(
    "Reconnecting to voice command websocket server at",
    VOICE_COMMAND_APP_WEBSOCKET_HOST,
    VOICE_COMMAND_APP_WEBSOCKET_PORT
  );
  _websocket = new WebSocket(
    `ws://${VOICE_COMMAND_APP_WEBSOCKET_HOST}:${VOICE_COMMAND_APP_WEBSOCKET_PORT}`
  );
  _websocket.onerror = () =>
    console.log(
      "Failed to connect to voice command websocket server (which is likely not a real problem for you)"
    );
  _websocket.binaryType = "blob";

  _websocket.onopen = () => sendMessage({ type: "connect", appId: "conjurer" });

  _websocket.onmessage = ({ data }) => {
    const dataString = data.toString();
    const message: VoiceCommandMessage = JSON.parse(dataString);

    if (message.type === "action")
      handleVoiceCommandActionMessage(store, message);
  };
};

let lastWarned = 0;
export const sendMessage = (message: VoiceCommandMessage) => {
  if (!_websocket || _websocket.readyState !== _websocket.OPEN) {
    if (Date.now() - lastWarned > 5000) {
      console.warn("Websocket not open, not sending message");
      lastWarned = Date.now();
    }
    return;
  }

  _websocket.send(JSON.stringify(message));
};
