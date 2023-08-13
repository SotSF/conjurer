import Jimp from "jimp";
import { WebSocketServer } from "ws";
import { LED_COUNTS } from "../utils/size";
import { WEBSOCKET_PORT } from "../utils/websocketHost";

const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
wss.on("connection", (ws) => {
  ws.on("error", console.error);

  let lastTime = Date.now();
  ws.on("message", (data: ArrayBuffer) => {
    // console.log("received data of length", data.byteLength);
  });
});
