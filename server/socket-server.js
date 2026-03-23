// socket-server.js
import { Server as SocketIOServer } from "socket.io";

let io;

let rooms = {};

export const initSocket = (httpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "http://localhost:8080",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const uid = socket.id
    console.log("User " + uid + " connected");


    socket.on("disconnect", () => {
      console.log("User " + uid + " disconnected");
    });

    
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};
