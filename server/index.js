// api-server.js
import express from "express";
import apiRoutes from "./routes/apiRoutes.js";

const app = express();
const API_PORT = 3001;

app.use(express.json());
app.use("/api", apiRoutes); // Use your API routes

app.listen(API_PORT, () => {
  console.log(`API Server running on http://localhost:${API_PORT}`);
});
