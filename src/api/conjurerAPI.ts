import { WebSocket, WebSocketServer } from "ws";
import { inspect } from "util";
import {
  ConjurerAPIMessage,
  ConjurerAPIRequestStateMessage,
  ConjurerAPIStateMessage,
} from "../../src/types/ConjurerAPIMessage";

interface MyWebSocket {
  primaryConjurerBrowserTab: boolean;
}

const wss = new WebSocketServer({ port: 8081 });
wss.on("connection", (ws) => {
  // Whenever a new client connects, check if there is already a primary Conjurer browser tab connected
  let conjurer: WebSocket | null = null;
  for (const client of wss.clients) {
    if ((client as unknown as MyWebSocket).primaryConjurerBrowserTab)
      conjurer = client;
  }

  // If there is a primary Conjurer browser tab, request the current state
  if (conjurer) {
    conjurer.send(
      JSON.stringify({
        event: "request_state",
      } satisfies ConjurerAPIRequestStateMessage),
    );
    return;
  }

  // Otherwise, communicate that conjurer is disconnected
  ws.send(
    JSON.stringify({
      event: "conjurer_state_update",
      data: {
        browser_tab_state: "disconnected",
        modes_available: [],
        current_mode: null,
      },
    } satisfies ConjurerAPIStateMessage),
  );

  ws.on("error", console.error);

  ws.on("message", (rawData: Buffer) => {
    const dataString = rawData.toString();
    const data = JSON.parse(dataString) as ConjurerAPIMessage;
    console.log("received", inspect(data, { depth: 10 }));

    if (data.event === "conjurer_state_update") {
      // Mark this client as the primary Conjurer browser tab. Always the last Conjurer browser tab to connect.
      wss.clients.forEach(
        (client) =>
          ((client as unknown as MyWebSocket).primaryConjurerBrowserTab =
            false),
      );
      (ws as unknown as MyWebSocket).primaryConjurerBrowserTab = true;

      // Forward the updated state to all clients that are not the primary Conjurer browser tab
      wss.clients.forEach(
        (client) =>
          !(client as unknown as MyWebSocket).primaryConjurerBrowserTab &&
          client.send(dataString),
      );
      return;
    }

    // Otherwise, forward the message to only the primary Conjurer browser tab
    wss.clients.forEach(
      (client) =>
        (client as unknown as MyWebSocket).primaryConjurerBrowserTab &&
        client.send(dataString),
    );
  });
});
