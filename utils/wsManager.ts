import { WebSocket } from "ws";

export const wsClients = new Set<WebSocket>();

export function broadcastDataUpdate(module: string) {
  const payload = JSON.stringify({
    type: "data_update",
    module
  });

  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      try {
        client.send(payload);
      } catch (err) {
        console.error("Error sending WS data_update message:", err);
      }
    }
  });
}

export function broadcastHardwareUpdate(devices: any[]) {
  const payload = JSON.stringify({
    type: "hardware_update",
    data: {
      devices,
      timestamp: new Date().toLocaleTimeString("uz-UZ")
    }
  });

  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      try {
        client.send(payload);
      } catch (err) {
        console.error("Error sending WS hardware_update message:", err);
      }
    }
  });
}

export function broadcastToWs(data: any) {
  const payload = JSON.stringify(data);
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      try {
        client.send(payload);
      } catch (err) {
        console.error("Error sending WS message:", err);
      }
    }
  });
}
