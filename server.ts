import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";

import app from "./app";
import { wsClients } from "./utils/wsManager";
import { startTelegramBot } from "./utils/telegramManager";
import { dbState } from "./db";

dotenv.config();

const PORT = 3000;

// API Route Fallback (404 for unmatched API requests)
app.use("/api/*", (req, res) => {
  console.warn(`[BACKEND API 404] Route not found: ${req.method} ${req.path} (Original: ${req.originalUrl})`);
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.path}`
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

  // Start real-world Telegram Bot long-polling loop if credentials are set
  startTelegramBot();

  // Integrated Vite Dev-Server Middleware for Assets / Production Static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get("*", (req: any, res: any) => {
        res.sendFile(indexPath);
      });
    } else {
      app.get("/", (req: any, res: any) => {
        res.json({
          status: "online",
          message: "🍃 Bog'cham.uz Backend SaaS Server is Live!",
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[ERP Core] Modular Full-Stack Server with WebSocket running on http://0.0.0.0:${PORT}`);
    console.log(`[Face ID Integration] Active listener for biometrics on port ${PORT}`);

    // Self-ping Keep-Alive Loop (Every 10 seconds to keep Render awake & active)
    setInterval(async () => {
      try {
        const pingUrl = `http://127.0.0.1:${PORT}/api/health`;
        await fetch(pingUrl);
      } catch (err: any) {
        // Silent keep-alive ping
      }
    }, 10000);
    console.log("[Keep-Alive Cron] Active: 10-second self-ping loop initialized to prevent Render sleep mode.");
  });
}

startServer();
export default app;
