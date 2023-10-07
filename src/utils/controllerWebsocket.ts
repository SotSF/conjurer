import { SerializedBlock } from "@/src/types/Block";
import { ControllerMessage } from "@/src/types/ControllerMessage";
import {
  CONTROLLER_SERVER_WEBSOCKET_HOST,
  CONTROLLER_SERVER_WEBSOCKET_PORT,
} from "@/src/utils/websocketHost";

let _websocket: WebSocket;

export const setupControllerWebsocket = (
  context: string,
  onUpdate?: (serializedBlock: SerializedBlock) => void
) => {
  console.log(
    "Reconnecting to websocket server at",
    CONTROLLER_SERVER_WEBSOCKET_HOST,
    CONTROLLER_SERVER_WEBSOCKET_PORT
  );
  _websocket = new WebSocket(
    `ws://${CONTROLLER_SERVER_WEBSOCKET_HOST}:${CONTROLLER_SERVER_WEBSOCKET_PORT}`
  );
  _websocket.binaryType = "blob";

  _websocket.onopen = () => sendControllerMessage({ type: "connect", context });

  _websocket.onmessage = ({ data }) => {
    const dataString = data.toString();
    const message: ControllerMessage = JSON.parse(dataString);

    if (message.type === "updateBlock") onUpdate?.(message.serializedBlock);
  };
};

let lastWarned = 0;
export const sendControllerMessage = (message: ControllerMessage) => {
  if (!_websocket || _websocket.readyState !== _websocket.OPEN) {
    if (Date.now() - lastWarned > 5000) {
      console.warn("Websocket not open, not sending message");
      lastWarned = Date.now();
    }
    return;
  }

  _websocket.send(JSON.stringify(message));
};
