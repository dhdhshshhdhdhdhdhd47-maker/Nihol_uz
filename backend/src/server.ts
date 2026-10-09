import express from "express";
import http from "http";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";

import app from "./app";
import { wsClients } from "./utils/wsManager";
import { startTelegramBot } from "./utils/telegramManager";
import { dbState } from "./db";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);

// API Route Fallback (404 for unmatched API requests)
app.use("/api/*", (req, res) => {
  console.warn(`[BACKEND API 404] Route not found: ${req.method} ${req.path} (Original: ${req.originalUrl})`);
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.path}`
  });
});

// Root ping
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Nihol AI Kindergarten ERP Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  const server = http.createServer(app);
  
  // Set up real-time bidirectional WebSocket pipeline
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (ws) => {
    wsClients.add(ws);
    
    // Send initial status immediately on connection
    const initialState = JSON.stringify({
      type: "hardware_update",
      data: {
        devices: dbState.activeDevices,
        totalDevicesCount: dbState.activeDevices.length,
        onlineDevicesCount: dbState.activeDevices.filter(d => d.status === "Online" || d.status === "online").length,
        faceIdCamerasCount: dbState.activeDevices.filter(d => d.type === "entrance" || d.type === "exit").length,
        healthPercentage: Math.round((dbState.activeDevices.filter(d => d.status === "Online" || d.status === "online").length / (dbState.activeDevices.length || 1)) * 100)
      }
    });
    ws.send(initialState);
    
    ws.on("close", () => {
      wsClients.delete(ws);
    });
    
    ws.on("error", (err) => {
      console.error("WS client error:", err);
      wsClients.delete(ws);
    });
  });

  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? request.url.split("?")[0] : "";
    if (pathname === "/ws-hardware" || pathname === "/" || pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  // Start Telegram Bot polling
  startTelegramBot();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Nihol ERP Backend] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Swagger Docs] Available on http://0.0.0.0:${PORT}/api-docs`);
  });
}

startServer();
