import { createServer } from "http";
import { parse } from "url";
import next from "next";
import conf from "../../next.config";

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: true, conf });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(`> Server listening at http://localhost:${port}`);
});
