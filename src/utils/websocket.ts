import { WEBSOCKET_HOST, WEBSOCKET_PORT } from "@/src/utils/websocketHost";

let _websocket: WebSocket;

export const setupWebsocket = () => {
  _websocket = new WebSocket(`ws://${WEBSOCKET_HOST}:${WEBSOCKET_PORT}`);
  _websocket.binaryType = "arraybuffer";
};

setupWebsocket();

export const transmitData = (data: Uint8Array) => {
  if (_websocket.readyState !== _websocket.OPEN) {
    console.warn("Websocket not open, not sending data");
    return;
  }

  _websocket.send(data.buffer);
};
