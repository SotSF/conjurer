const WEBSOCKET_HOST = "localhost";
const WEBSOCKET_PORT = "8080";

const websocket = new WebSocket(`ws://${WEBSOCKET_HOST}:${WEBSOCKET_PORT}`);
websocket.binaryType = "arraybuffer";

export const transmitData = (data: Uint8Array) => websocket.send(data.buffer);
