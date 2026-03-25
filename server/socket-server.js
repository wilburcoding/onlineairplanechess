// socket-server.js
import { Server as SocketIOServer } from "socket.io";

let io;

let rooms = {};

function generate_id(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generate_room_code() {
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
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
    const uid = socket.id;
    console.log("User " + uid + " connected");

    socket.on("disconnect", () => {
      console.log("User " + uid + " disconnected");
    });

    socket.on("create-room", (data) => {
      let room_data = {
        id: generate_id(6),
        code: generate_room_code(),
        players: [{ id: uid, username: data.username }],
        state: "waiting",
      };
      rooms[room_data.id] = room_data;
      socket.join(room_data.id);
      socket.emit("waiting-room-update", room_data);
    });

    socket.on("leave-room", () => {
      let room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === uid),
      );
      if (room) {
        if (room.players[0].id === uid) {
          // is host
          room.players = [];
          io.to(room.id).emit("waiting-room-update", room);
          socket.leave(room.id)
          if (room.players.length == 0) {
            delete rooms[room.id]
          }
        } else {
          room.players = room.players.filter((p) => p.id !== uid);
          io.to(room.id).emit("waiting-room-update", room);
          socket.leave(room.id);
          if (room.players.length === 0) {
            delete rooms[room.id];
          }
        }

      }
      console.log(rooms);
    });

    socket.on("join-room", (data, callback) => {
      let room = Object.values(rooms).find((r) => r.code === data.room_code);
      if (room) {
        if (room.players.length >= 4) {
          callback({ message: "The room you are trying to join is full." });
          return;
        }
        room.players.push({ id: uid, username: data.username });
        socket.join(room.id);

        io.to(room.id).emit("waiting-room-update", room);
        callback({ message: "success" });
      } else {
        callback({
          message: "Your game code is invalid. Please check and try again.",
        });
      }
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
