import Jimp from "jimp";
import { WebSocketServer } from "ws";
import { LED_COUNTS } from "../utils/size";
import { WEBSOCKET_PORT } from "../utils/websocketHost";

// set this to true to write the received images to disk
const WRITE_IMAGES = true;

const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
wss.on("connection", (ws) => {
  ws.on("error", console.error);

  let lastTime = Date.now();
  ws.on("message", (data: ArrayBuffer) => {
    // console.log("received data of length", data.byteLength);

    if (WRITE_IMAGES) {
      // do some manual throttling: only write an image once per second
      if (Date.now() - lastTime < 1000) return;
      lastTime = Date.now();

      writeImage(new Uint8Array(data));
    }
  });
});

const writeImage = (inputBuffer: Uint8Array) => {
  const image = new Jimp(LED_COUNTS.x, LED_COUNTS.y);
  image.bitmap.data = Buffer.from(inputBuffer);
  image.write("src/scripts/output.png");
};
