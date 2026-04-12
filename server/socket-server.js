// socket-server.js
import { Server as SocketIOServer } from "socket.io";
import { Filter } from "bad-words";
let io;

let rooms = {};
const filter = new Filter();

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
    room.message = "The game has ended! See the results below.";
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
        if (room.state == "active-game") {
          if (room.players.length > 2) {
            if (room.players[0].id === uid) {
              // is host -> end game for everyone
              room.message =
                "The host has left the game. The game has ended, see the results below.";
              io.to(room.id).emit("game-end-sudden", room);
              delete rooms[room.id];
            } else {
              // not host -> remove player from room and update
              // update turn
              // room.players = room.players.filter((p) => p.id !== uid);

              while (room.players[room.turn].id === uid) {
                room.turn = (room.turn + 1) % room.players.length;
              }
              const TURN_PLAYER = room.players[room.turn];
              room.players = room.players.filter((p) => p.id !== uid);
              room.turn = room.players.findIndex(
                (p) => p.id === TURN_PLAYER.id,
              );
              room.update = false;
              io.to(room.id).emit("game-update", room);
            }
          } else {
            // no enough players -> end game for everyone
            room.message =
              "There are not enough players to continue. The game has ended, see the results below.";
            io.to(room.id).emit("game-end-sudden", room);
            delete rooms[room.id];
          }
        } else {
          if (room.players[0].id === uid) {
            // is host -> delete room and emit update to everyone in room
            room.players = [];
            io.to(room.id).emit("waiting-room-update", room);
            delete rooms[room.id];
          } else {
            // not host -> remove player from room
            room.players = room.players.filter((p) => p.id !== uid);
            io.to(room.id).emit("waiting-room-update", room);
          }

          let public_rooms = Object.values(rooms)
            .filter((r) => r.settings.visibility == "public")
            .map((r) => r);
          socket.broadcast.emit("public-rooms-update", public_rooms);
        }
      } else {
        // check if user was spectating a game
        let room = Object.values(rooms).find((r) => r.spectators && r.spectators.some((p) => p.id === uid));
        if (room) {
          room.spectators = room.spectators.filter((p) => p.id !== uid);
        }
      }
    });

    socket.on("create-room", (data) => {
      let room_data = {
        id: generate_id(6),
        code: generate_room_code(),
        players: [{ id: uid, username: data.username }],
        state: "waiting",
        settings: {
          visibility: "private",
          max_players: 4,
          even_launch: false,
          home_backtrack: true,
        },
      };
      rooms[room_data.id] = room_data;
      socket.join(room_data.id);
      socket.emit("waiting-room-update", room_data);
      let public_rooms = Object.values(rooms)
        .filter((r) => r.settings.visibility == "public")
        .map((r) => r);
      socket.broadcast.emit("public-rooms-update", public_rooms);
    });

    // handle public rooms request
    socket.on("request-public-rooms", () => {
      let public_rooms = Object.values(rooms)
        .filter((r) => r.settings.visibility == "public")
        .map((r) => r);
      socket.emit("public-rooms-update", public_rooms);
    });

    // settings update
    socket.on("update-settings", (data) => {
      let room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === uid),
      );
      if (room) {
        room.settings = data;
        for (let i = 0; i < room.players.length; i++) {
          if (i >= room.settings.max_players) {
            // remove extra players if max player count is changed
            room.players = room.players.slice(0, room.settings.max_players);
            io.to(room.id).emit("waiting-room-update", room);
            break;
          }
        }
      }
      let public_rooms = Object.values(rooms)
        .filter((r) => r.settings.visibility == "public")
        .map((r) => r);
      socket.broadcast.emit("public-rooms-update", public_rooms);
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
      let public_rooms = Object.values(rooms)
        .filter((r) => r.settings.visibility == "public")
        .map((r) => r);
      socket.broadcast.emit("public-rooms-update", public_rooms);
    });

    // handle joining rooms
    socket.on("join-room", (data, callback) => {
      let room = Object.values(rooms).find((r) => r.code === data.room_code);
      if (room) {
        if (room.state == "active-game") {
          callback({ message: "The game in this room has already started." });
          return;
        }
        if (room.players.length >= room.settings.max_players) {
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
      let public_rooms = Object.values(rooms)
        .filter((r) => r.settings.visibility == "public")
        .map((r) => r);
      socket.broadcast.emit("public-rooms-update", public_rooms);
    });
    const COLORS = ["green", "red", "yellow", "blue"];

    //handle game start from host
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
          room.spectators = [];
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
                // status: j < 0 ? "finished" : "home", // debugging only
                status: "home",
                location:
                  room.players[i].color.substring(0, 1).toUpperCase() + "-" + j,
              });
            }
          }
          io.to(room.id).emit("game-start", room);
        }
        io.to(room.id).emit("game-update", room);
      }
      let public_rooms = Object.values(rooms)
        .filter((r) => r.settings.visibility == "public")
        .map((r) => r);
      socket.broadcast.emit("public-rooms-update", public_rooms);
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
            if (loc_num > 5 && room.settings.home_backtrack) {
              loc_num = 6 - (loc_num - 6);
              console.log("backtracked");
            }
            if (
              loc_num == 6 ||
              (loc_num > 5 && !room.settings.home_backtrack)
            ) {
              // finish
              if (loc_num > 5 && room.settings.home_backtrack) {
                console.log("piece finished without backtracking");
              }
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

    // handle new chat message
    socket.on("send-chat", (data) => {
      console.log(data);
      let room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === uid),
      );
      if (room) {
        io.to(room.id).emit("recieve-chat", {
          username: room.players.find((p) => p.id === uid).username,
          message: filter.clean(data.message),
          id: uid,
          type: "player",
          color: room.players.find((p) => p.id === uid).color
        });
      } else {
        // check if is spectator
        let room = Object.values(rooms).find(
          (r) => r.spectators && r.spectators.some((p) => p.id === uid),
        );
        if (room) {
          io.to(room.id).emit("recieve-chat", {
            username: room.spectators.find((p) => p.id === uid).username,
            message: filter.clean(data.message),
            id: uid,
            type: "spectator",
            color: null
          });
        }
      }
    });

    // handle spectate game
    socket.on("spectate-game", (data) => {
      let room = Object.values(rooms).find((r) => r.code === data.room_code);
      if (room) {
        room.spectators.push({ id: uid, username: data.username});
        socket.join(room.id);
        socket.emit("game-start", room);
        socket.emit("game-update", room);
      }
    });

    // handle spectator leaving
    socket.on("leave-spectate", () => {
      let room = Object.values(rooms).find((r) => r.spectators && r.spectators.some((p) => p.id === uid));
      if (room) {
        room.spectators = room.spectators.filter((p) => p.id !== uid);
        socket.leave(room.id);

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
