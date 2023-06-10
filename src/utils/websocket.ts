import { WEBSOCKET_HOST, WEBSOCKET_PORT } from "@/src/utils/websocketHost";

let _websocket: WebSocket;

export const setupWebsocket = () => {
  console.log(
    "Reconnecting to websocket server at",
    WEBSOCKET_HOST,
    WEBSOCKET_PORT
  );
  _websocket = new WebSocket(`ws://${WEBSOCKET_HOST}:${WEBSOCKET_PORT}`);
  _websocket.binaryType = "arraybuffer";
};

let lastWarned = 0;
export const transmitData = (data: Uint8Array) => {
  if (!_websocket) {
    setupWebsocket();
    return;
  }

  if (_websocket.readyState !== _websocket.OPEN) {
    if (Date.now() - lastWarned > 5000) {
      console.warn("Websocket not open, not sending data");
      lastWarned = Date.now();
    }
    return;
  }

  _websocket.send(data.buffer);
};
