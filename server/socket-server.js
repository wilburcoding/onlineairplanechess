// socket-server.js
import { Server as SocketIOServer } from "socket.io";

let io;

let rooms = {};

function generate_id(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i =0 ; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generate_room_code() {
    const numbers = "0123456789";
    let result = "";
    for (let i = 0; i < 6;i++) {
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return result;
}

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

    socket.on("create-room", () => {
        let room_data = {
            id: generate_id(6),
            players:[uid],
        }
    }) 


  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};
