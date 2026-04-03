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

function check_win(io, room) {
  let finished_count = 0;
  for (let i = 0; i < room.players.length; i++) {
    let player_finished = true;
    for (let j = 0; j < room.players[i].pieces.length; j++) {
      if (room.players[i].pieces[j].status != "finished") {
        player_finished = false;
        break;
      }
    }
    if (player_finished) {
      if (room.players[i].finish_count == -1) {
        room.players[i].finish_count = room.tcount;
      }
      finished_count += 1;
    }
  }
  room.tcount += 1;
  room.update = true;
  if (finished_count == room.players.length - 1) {
    //find last player who hasn't finished
    for (let i = 0; i < room.players.length; i++) {
      if (room.players[i].finish_count == -1) {
        room.players[i].finish_count = room.tcount;
        break;
      }
    }

    io.to(room.id).emit("game-end", room);
  } else {
    io.to(room.id).emit("game-update", room);
  }
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
      // check if user was in a room
      let room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === uid),
      );
      if (room) {
        if (room.players.length > 2) {
          if (room.players[0].id === uid) {
            // is host -> end game for everyone
            io.to(room.id).emit("game-end-sudden", room);
          } else {
            // not host -> remove player from room and update
            // update turn
            // room.players = room.players.filter((p) => p.id !== uid);

            while (room.players[room.turn].id === uid) {
              room.turn = (room.turn + 1) % room.players.length;
            }
            const TURN_PLAYER = room.players[room.turn];
            room.players = room.players.filter((p) => p.id !== uid);
            room.turn = room.players.findIndex((p) => p.id === TURN_PLAYER.id);
            room.update = false;

            io.to(room.id).emit("game-update", room);
          }
        } else {
          // no enough players -> end game for everyone
          io.to(room.id).emit("game-end-sudden", room);
        }
      } else {
        // do nothing
      }
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
          socket.leave(room.id);
          if (room.players.length == 0) {
            delete rooms[room.id];
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
    const COLORS = ["green", "red", "yellow", "blue"];
    socket.on("start-game", () => {
      let room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === uid),
      );

      if (room) {
        if (room.players[0].id === uid) {
          room.state = "active-game";
          room.turn = 0;
          room.tcount = 0;
          room.update = true;
          room.history = [];
          for (let i = 0; i < room.players.length; i++) {
            room.players[i].color = COLORS[i];
            room.players[i].pieces = [];
            room.players[i].finish_count = -1;
            room.players[i].stats = {
              jumps: 0,
              sixs: 0,
              captures: 0,
            };
            for (let j = 0; j < 4; j++) {
              room.players[i].pieces.push({
                status: j < 3 ? "finished" : "home", // debugging only
                location:
                  room.players[i].color.substring(0, 1).toUpperCase() + "-" + j,
              });
            }
          }
          io.to(room.id).emit("game-start", room);
        }
        io.to(room.id).emit("game-update", room);
      }
    });

    //skip turn
    socket.on("skip-turn", () => {
      let room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === uid),
      );
      room.history.push({
        text:
          room.players[room.turn].username +
          "'s turn was skipped as they had no moves",
        type: "skip",
        color: room.turn,
      });
      room.turn = (room.turn + 1) % room.players.length;
      // dosen't add turn
      room.tcount += 1;
      room.update = true;
      io.to(room.id).emit("game-update", room);
    });
    // move piece event -> calculate new position and update game
    socket.on("move-piece", (data) => {
      let room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === uid),
      );
      let player_index = data.player;
      let piece_index = data.piece;
      let dice_roll = data.roll;
      if (dice_roll == 6) {
        room.players[player_index].stats.sixs += 1;
      }

      if (room.players[player_index].pieces[piece_index].status === "home") {
        room.players[player_index].pieces[piece_index].status = "active";
        room.players[player_index].pieces[piece_index].location =
          COLORS[player_index].substring(0, 1).toUpperCase() + "-exit";

        // room.turn = (room.turn + 1) % room.players.length; -> removing from home is always a 6 so player gets another turn
        room.history.push({
          text:
            room.players[player_index].username +
            "'s piece is now ready to move",
          type: "activate",
          color: player_index,
        });
        room.history.push({
          text:
            room.players[player_index].username +
            " rolled a 6 and gets another turn",
          type: "repeat",
          color: player_index,
        });
        check_win(io, room);
      } else if (
        room.players[player_index].pieces[piece_index].status === "active"
      ) {
        // two types of locations: main path and hangar path;
        let loc_type =
          room.players[player_index].pieces[piece_index].location.split("-")[0];
        let loc_num =
          room.players[player_index].pieces[piece_index].location.split("-")[1];
        let prev_num = loc_num;
        if (prev_num == "exit") {
          prev_num = [28, 41, 2, 15][player_index];
        }
        if (loc_num == "exit") {
          // checks: landing on teams pieces, same color
          loc_type = "M";
          loc_num = [28, 41, 2, 15][player_index] + dice_roll;

          for (let i = 0; i < room.players.length; i++) {
            for (let j = 0; j < room.players[i].pieces.length; j++) {
              if (
                room.players[i].pieces[j].location ==
                  loc_type + "-" + loc_num &&
                i != player_index
              ) {
                // capture piece
                room.players[i].pieces[j].status = "home";
                room.players[player_index].stats.captures += 1;
                room.players[i].pieces[j].location =
                  room.players[i].color.substring(0, 1).toUpperCase() + "-" + j;
                room.history.push({
                  text:
                    room.players[player_index].username +
                    "'s piece has captured " +
                    room.players[i].username +
                    "'s piece",
                  type: "capture",
                  color: player_index,
                });
              }
            }
          }

          if (loc_num % 4 == [2, 3, 0, 1][player_index]) {
            //landing on same color -> go ahead 4 spaces and check if
            loc_num += 4;
            room.players[player_index].stats.jumps += 1;
          }
          room.players[player_index].pieces[piece_index].location =
            loc_type + "-" + loc_num;

          let move_num = loc_num - parseInt(prev_num);
          if (prev_num > loc_num) {
            move_num = loc_num + (52 - parseInt(prev_num));
          }

          room.history.push({
            text:
              room.players[player_index].username +
              "'s piece has moved " +
              move_num +
              " spaces",
            type: "move",
            color: player_index,
          });
          if (dice_roll != 6) {
            room.turn = (room.turn + 1) % room.players.length;
          } else {
            room.history.push({
              text:
                room.players[player_index].username +
                " rolled a 6 and gets another turn",
              type: "repeat",
              color: player_index,
            });
          }

          check_win(io, room);
        } else {
          loc_num = parseInt(loc_num);
          loc_num += dice_roll;
          //checks: same color, flying shortcut, landing on other teams pieces, entering hangar path, finish path
          if (loc_type == "M") {
            console.log("Main path");
            // currently on main path ->
            const EXIT_LOCATIONS = [26, 39, 52, 13];

            if (
              loc_num > EXIT_LOCATIONS[player_index] &&
              prev_num <= EXIT_LOCATIONS[player_index]
            ) {
              loc_type =
                room.players[player_index].color.substring(0, 1).toUpperCase() +
                "H";
              loc_num = loc_num % EXIT_LOCATIONS[player_index];
              // hangar path -> nothing else to check
              room.history.push({
                text:
                  room.players[player_index].username +
                  "'s piece has entered the hangar path",
                type: "move",
                color: player_index,
              });
            } else if (loc_num == EXIT_LOCATIONS[player_index]) {
              // exact landing -> piece finishes
              room.players[player_index].pieces[piece_index].status =
                "finished";
              room.players[player_index].pieces[piece_index].location =
                room.players[player_index].color.substring(0, 1).toUpperCase() +
                "-" +
                piece_index;
              room.history.push({
                type: "win",
                text:
                  room.players[player_index].username +
                  "'s piece has finished their journey!",
                color: player_index,
              });
              room.turn = (room.turn + 1) % room.players.length;
              check_win(io, room);
              return;
            } else {
              if (loc_num > 52) {
                loc_num = loc_num % 52;
              }
              // check capture piece
              for (let i = 0; i < room.players.length; i++) {
                for (let j = 0; j < room.players[i].pieces.length; j++) {
                  if (
                    room.players[i].pieces[j].location ==
                      loc_type + "-" + loc_num &&
                    i != player_index
                  ) {
                    room.players[player_index].stats.captures += 1;
                    room.players[i].pieces[j].status = "home";
                    room.players[i].pieces[j].location =
                      room.players[i].color.substring(0, 1).toUpperCase() +
                      "-" +
                      j;
                    room.history.push({
                      text:
                        room.players[player_index].username +
                        "'s piece has captured " +
                        room.players[i].username +
                        "'s piece",
                      type: "capture",
                      color: player_index,
                    });
                  }
                }
              }
              let jumped = false;
              let flying = false;
              // same color shortcut OR flying shortcut
              if ([46, 7, 20, 33][player_index] == loc_num) {
                loc_num += 12;
                flying = true;
              } else if (loc_num % 4 == [2, 3, 0, 1][player_index]) {
                //landing on same color -> go ahead 4 spaces and check if
                loc_num += 4;
                room.players[player_index].stats.jumps += 1;
                jumped = true;

                //check if jumped onto hangar win spot
              }
              if (loc_num > 52) {
                loc_num = loc_num % 52;
              }
              if (loc_num == EXIT_LOCATIONS[player_index]) {
                room.players[player_index].pieces[piece_index].status =
                  "finished";
                room.players[player_index].pieces[piece_index].location =
                  room.players[player_index].color
                    .substring(0, 1)
                    .toUpperCase() +
                  "-" +
                  piece_index;
                room.history.push({
                  type: "win",
                  text:
                    room.players[player_index].username +
                    "'s piece has finished their journey!",
                  color: player_index,
                });
                room.turn = (room.turn + 1) % room.players.length;
                check_win(io, room);
                return;
              }
              // check everything again now that at new spot
              // check capture piece
              for (let i = 0; i < room.players.length; i++) {
                for (let j = 0; j < room.players[i].pieces.length; j++) {
                  if (
                    room.players[i].pieces[j].location ==
                      loc_type + "-" + loc_num &&
                    i != player_index
                  ) {
                    room.players[i].pieces[j].status = "home";
                    room.players[player_index].stats.captures += 1;
                    room.players[i].pieces[j].location =
                      room.players[i].color.substring(0, 1).toUpperCase() +
                      "-" +
                      j;
                    room.history.push({
                      text:
                        room.players[player_index].username +
                        "'s piece has captured " +
                        room.players[i].username +
                        "'s piece",
                      type: "capture",
                      color: player_index,
                    });
                  }
                }
              }

              if (jumped) {
                if ([46, 7, 20, 33][player_index] == loc_num) {
                  loc_num += 12;
                }
              }
              if (flying) {
                if (loc_num % 4 == [2, 3, 0, 1][player_index] && !jumped) {
                  loc_num += 4;
                  room.players[player_index].stats.jumps += 1;
                }
              }
              if (loc_num > 52) {
                loc_num = loc_num % 52;
              }

              if (flying || jumped) {
                // check capture piece
                for (let i = 0; i < room.players.length; i++) {
                  for (let j = 0; j < room.players[i].pieces.length; j++) {
                    if (
                      room.players[i].pieces[j].location ==
                        loc_type + "-" + loc_num &&
                      i != player_index
                    ) {
                      room.players[i].pieces[j].status = "home";
                      room.players[player_index].stats.captures += 1;
                      room.players[i].pieces[j].location =
                        room.players[i].color.substring(0, 1).toUpperCase() +
                        "-" +
                        j;
                      room.history.push({
                        text:
                          room.players[player_index].username +
                          "'s piece has captured " +
                          room.players[i].username +
                          "'s piece",
                        type: "capture",
                        color: player_index,
                      });
                    }
                  }
                }
              }
            }
            room.players[player_index].pieces[piece_index].location =
              loc_type + "-" + loc_num;
            let move_num = loc_num - parseInt(prev_num);
            if (prev_num > loc_num) {
              move_num = loc_num + (52 - parseInt(prev_num));
            }
            room.history.push({
              text:
                room.players[player_index].username +
                "'s piece has moved " +
                move_num +
                " spaces",
              type: "move",
              color: player_index,
            });
            if (dice_roll != 6) {
              room.turn = (room.turn + 1) % room.players.length;
            } else {
              room.history.push({
                text:
                  room.players[player_index].username +
                  " rolled a 6 and gets another turn",
                type: "repeat",
                color: player_index,
              });
            }

            check_win(io, room);
          } else if (loc_type.includes("H")) {
            // hangar path
            if (loc_num > 5) {
              loc_num = 6 - (loc_num - 6);
            }
            if (loc_num == 6) {
              // finish
              room.players[player_index].pieces[piece_index].status =
                "finished";
              room.players[player_index].pieces[piece_index].location =
                room.players[player_index].color.substring(0, 1).toUpperCase() +
                "-" +
                piece_index;
              room.history.push({
                type: "win",
                text:
                  room.players[player_index].username +
                  "'s piece has finished their journey!",
                color: player_index,
              });
            } else {
              room.players[player_index].pieces[piece_index].location =
                loc_type + "-" + loc_num;
            }

            if (dice_roll != 6) {
              room.turn = (room.turn + 1) % room.players.length;
            } else {
              room.history.push({
                text:
                  room.players[player_index].username +
                  " rolled a 6 and gets another turn",
                type: "repeat",
                color: player_index,
              });
            }
            check_win(io, room);
          }
        }
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
