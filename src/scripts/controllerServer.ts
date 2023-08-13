import { WebSocketServer } from "ws";
import { CONTROLLER_SERVER_WEBSOCKET_PORT } from "../utils/websocketHost";

const wss = new WebSocketServer({ port: CONTROLLER_SERVER_WEBSOCKET_PORT });
wss.on("connection", (ws) => {
  ws.on("error", console.error);

  let lastTime = Date.now();
  ws.on("message", (data: ArrayBuffer) => {
    // console.log("received data of length", data.byteLength);
  });
});
