import { ControllerMessage } from "@/src/types/ControllerMessage";
import {
  CONTROLLER_SERVER_WEBSOCKET_HOST,
  CONTROLLER_SERVER_WEBSOCKET_PORT,
} from "@/src/utils/websocketHost";

let _websocket: WebSocket;

export const setupControllerWebsocket = () => {
  console.log(
    "Reconnecting to websocket server at",
    CONTROLLER_SERVER_WEBSOCKET_HOST,
    CONTROLLER_SERVER_WEBSOCKET_PORT
  );
  _websocket = new WebSocket(
    `ws://${CONTROLLER_SERVER_WEBSOCKET_HOST}:${CONTROLLER_SERVER_WEBSOCKET_PORT}`
  );
  _websocket.binaryType = "blob";

  _websocket.onopen = () => sendControllerMessage({ type: "connect" });
};

let lastWarned = 0;
export const sendControllerMessage = (message: ControllerMessage) => {
  if (!_websocket) {
    setupControllerWebsocket();
    return;
  }

  if (_websocket.readyState !== _websocket.OPEN) {
    if (Date.now() - lastWarned > 5000) {
      console.warn("Websocket not open, not sending message");
      lastWarned = Date.now();
    }
    return;
  }

  _websocket.send(JSON.stringify(message));
};
