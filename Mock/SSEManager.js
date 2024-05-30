// SSEManager.js

import { EventSourcePolyfill } from "event-source-polyfill";
import ApiUrl from "./config";

const sseConnections = {};

const SSEManager = {
  openConnection: (gameCode, callback) => {
    console.log("Opened")
    if (!sseConnections[gameCode]) {
      const eventSource = new EventSourcePolyfill(`${ApiUrl}:8000/games/${gameCode}/sse/`);
      eventSource.onmessage = (event) => {
        
        const data = JSON.parse(event.data);
        console.log(data)
        callback(data);
      };
      sseConnections[gameCode] = eventSource;
    }
  },

  closeConnection: (gameCode) => {
    if (sseConnections[gameCode]) {
      sseConnections[gameCode].close();
      delete sseConnections[gameCode];
    }
  },

  closeAllConnections: () => {
    Object.values(sseConnections).forEach((eventSource) => eventSource.close());
    sseConnections = {};
  },
};

export default SSEManager;
