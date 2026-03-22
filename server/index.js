// index.js
import express from "express";
import http from "http";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";
import { initSocket } from "./socket-server.js";

const app = express();
const server = http.createServer(app);
const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api", apiRoutes);

initSocket(server); 

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
