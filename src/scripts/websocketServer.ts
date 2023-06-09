import Jimp from "jimp";
import { WebSocketServer } from "ws";
import { LED_COUNTS } from "../utils/size";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data: ArrayBuffer) => {
    console.log("received data of length", data.byteLength);
    writeImage(new Uint8Array(data));
  });
});

const width = LED_COUNTS.x;
const height = LED_COUNTS.y;

const writeImage = (inputBuffer: Uint8Array) => {
  const image = new Jimp(width, height);
  const buffer = image.bitmap.data;
  for (let i = 0; i < buffer.length; i++) buffer[i] = inputBuffer[i];

  image.write("src/scripts/output.png");
};
