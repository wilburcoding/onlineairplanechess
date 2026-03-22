// http-server.js
import http from "http";
import { initSocket } from "./socket-server.js";
import express from "express";
// Import other routes and middleware as needed

const app = express();
const server = http.createServer(app); // Create an HTTP server instance

const SOCKET_PORT = 3001;

initSocket(server); // Initialize Socket.IO with the HTTP server

// Add main API routes to the app
// app.use('/api', apiRoutes);

server.listen(SOCKET_PORT, () => {
  console.log(`Socket & API Server running on http://localhost:${SOCKET_PORT}`);
});
