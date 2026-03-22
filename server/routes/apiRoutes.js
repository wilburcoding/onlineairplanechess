// routes/apiRoutes.js
import express from "express";
import { getIO } from "../socket-server.js"; // Import the getIO function

const router = express.Router();

router.post("/new-data", (req, res) => {
  const io = getIO(); // Get the initialized Socket.IO instance
  const data = req.body;

  // Do some database stuff or validation

  // Emit an event to all connected clients
  io.emit("data-update", data);

  res
    .status(200)
    .json({ success: true, message: "Data received and event emitted" });
});

export default router;
