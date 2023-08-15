import { WebSocketServer } from "ws";
import { CONTROLLER_SERVER_WEBSOCKET_PORT } from "../utils/websocketHost";
import { inspect } from "util";

const wss = new WebSocketServer({ port: CONTROLLER_SERVER_WEBSOCKET_PORT });
wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (rawData: Buffer) => {
    const data = JSON.parse(rawData.toString());
    console.log("received", data);
    console.log(inspect(data, { depth: 10 }));
  });
});
