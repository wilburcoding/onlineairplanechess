// index.js
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import apiRoutes from "./routes/apiRoutes.js";
import { initSocket } from "./socket-server.js";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api", apiRoutes);

// server.js
app.use(express.static(path.join(__dirname, "../dist")));

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
