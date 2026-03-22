// routes/apiRoutes.js
import express from "express";
import { getIO } from "../socket-server.js"; 

const router = express.Router();

router.post("/new-data", (req, res) => {
  const io = getIO(); 
  const data = req.body;

  io.emit("data-update", data);

  res
    .status(200)
    .json({ success: true, message: "Data received and event emitted" });
});

export default router;
