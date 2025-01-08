import type { Store } from "@/src/types/Store";
import { ConjurerAPIMessage } from "@/src/types/ConjurerAPIMessage";
import {
  CONJURER_API_WEBSOCKET_HOST,
  CONJURER_API_WEBSOCKET_PORT,
} from "@/src/websocket/websocketHost";

let _websocket: WebSocket;

export const setupConjurerApiWebsocket = (store: Store) => {
  console.log(
    "Reconnecting to Conjurer API websocket server at",
    CONJURER_API_WEBSOCKET_HOST,
    CONJURER_API_WEBSOCKET_PORT,
  );
  _websocket = new WebSocket(
    `ws://${CONJURER_API_WEBSOCKET_HOST}:${CONJURER_API_WEBSOCKET_PORT}`,
  );
  _websocket.onerror = () =>
    // TODO: Provides some ui feedback as well
    console.log("Failed to connect to Conjurer API websocket server.");
  _websocket.binaryType = "blob";

  _websocket.onopen = () =>
    sendMessage({
      event: "conjurer_state_update",
      browser_tab_state: "connected",
    });

  _websocket.onmessage = ({ data }) => {
    const dataString = data.toString();
    const message: ConjurerAPIMessage = JSON.parse(dataString);

    // if (message.type === "action")
    //   handleVoiceCommandActionMessage(store, message);
  };
};

let lastWarned = 0;
export const sendMessage = (message: ConjurerAPIMessage) => {
  if (!_websocket || _websocket.readyState !== _websocket.OPEN) {
    if (Date.now() - lastWarned > 5000) {
      console.warn("Websocket not open, not sending message");
      lastWarned = Date.now();
    }
    return;
  }

  _websocket.send(JSON.stringify(message));
};
