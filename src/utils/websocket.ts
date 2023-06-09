import { WEBSOCKET_HOST, WEBSOCKET_PORT } from "@/src/utils/websocketHost";

const websocket = new WebSocket(`ws://${WEBSOCKET_HOST}:${WEBSOCKET_PORT}`);
websocket.binaryType = "arraybuffer";

export const transmitData = (data: Uint8Array) => websocket.send(data.buffer);
