import {
  Application,
  Assets,
  Sprite,
  Texture,
  Point,
  Polygon,
  Graphics,
  Text,
  TextStyle,
} from "pixi.js";
import { Viewport } from "pixi-viewport";
import { io } from "socket.io-client";

const socket = io();
socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
});
const AUTOCOMPLETE_MESSAGES = [
  "Good Game!",
  "Well Played!",
  "Nice Move!",
  "Close One!",
  "Unlucky!",
  "Lucky Roll!",
  "Your turn!",
  "Uh oh...",
  "Watch out!",
  "Not bad!",
  "Safe for now...",
  "Oops...",
  "That was close!",
];
const GUIDE_PAGES = [
  {
    title: "Setup & Starting",
    description:
      "All 4 planes begin in their hangar. Roll a 6 with the die to move one plane out to the starting track tile of your color. Each player uses unique colored planes",
    image: "p1.png",
  },
  {
    title: "Flight Path",
    description:
      "After starting, roll the die to move your planes clockwise. Special Rule: Land on a tile that matches your plane’s color to take a special boost and jump across sections. There are also even better shortcuts marked by the dotted lines.",
    image: "p2.png",
  },
  {
    title: "Capturing",
    description:
      'If your plane lands exactly on a tile occupied by an opponent, you "capture" them, sending their plane all the way back to their hangar to restart. You can even capture other planes after taking shortcuts, so look out for those opportunities!',
    image: "p3.png",
  },
  {
    title: "Winning",
    description:
      "Guide your planes to their finish lane (e.g., Red planes to the red finish section). To enter the final central finish point (marked by the diamond), you must roll the exact number required to land on it. The first player to finish all 4 planes wins!",
    image: "p4.png",
  },
];
const COLORS = ["green", "red", "yellow", "blue"];
const COLOR_HEX = [0xfb9a8, 0xee6c4d, 0xf4d35e, 0x4e7dba];
const COORDS = {}; // keep track of coords for specific location to make it easy to use in the future
function create_rect1(i, coord, viewport, color, tag) {
  const rect = new Graphics();
  const circle = new Graphics();
  // vertical rectangle
  if (i == 0) {
    rect.rect(coord[0], coord[1], 200, 300);
    circle.circle(coord[0] + 100, coord[1] + 150, 50);
    COORDS[tag] = [coord[0] + 100, coord[1] + 150];
  } else if (i == 1) {
    rect.rect(coord[0] - 300, coord[1], 300, 200);
    circle.circle(coord[0] - 150, coord[1] + 100, 50);
    COORDS[tag] = [coord[0] - 150, coord[1] + 100];
  } else if (i == 2) {
    rect.rect(coord[0] - 200, coord[1] - 300, 200, 300);
    circle.circle(coord[0] - 100, coord[1] - 150, 50);
    COORDS[tag] = [coord[0] - 100, coord[1] - 150];
  } else {
    rect.rect(coord[0], coord[1] - 200, 300, 200);
    circle.circle(coord[0] + 150, coord[1] - 100, 50);
    COORDS[tag] = [coord[0] + 150, coord[1] - 100];
  }
  circle.fill({ color: 0xffffff }).stroke({ color: 0x000000, width: 4 });
  rect.fill({ color: color });

  viewport.addChild(rect);
  viewport.addChild(circle);
}

function create_rect2(i, coord, viewport, color, tag) {
  const rect = new Graphics();
  const circle = new Graphics();

  // horizontal rectangle
  if (i == 0) {
    rect.rect(coord[0], coord[1], 300, 200);
    circle.circle(coord[0] + 150, coord[1] + 100, 50);
    COORDS[tag] = [coord[0] + 150, coord[1] + 100];
  } else if (i == 1) {
    rect.rect(coord[0] - 200, coord[1], 200, 300);
    circle.circle(coord[0] - 100, coord[1] + 150, 50);
    COORDS[tag] = [coord[0] - 100, coord[1] + 150];
  } else if (i == 2) {
    rect.rect(coord[0] - 300, coord[1] - 200, 300, 200);
    circle.circle(coord[0] - 150, coord[1] - 100, 50);
    COORDS[tag] = [coord[0] - 150, coord[1] - 100];
  } else {
    rect.rect(coord[0], coord[1] - 300, 200, 300);
    circle.circle(coord[0] + 100, coord[1] - 150, 50);
    COORDS[tag] = [coord[0] + 100, coord[1] - 150];
  }
  rect.fill({ color: color });
  circle.fill({ color: 0xffffff }).stroke({ color: 0x000000, width: 4 });
  viewport.addChild(rect);
  viewport.addChild(circle);
}

function incenter(coord1, coord2, coord3) {
  const a = Math.hypot(coord2[0] - coord3[0], coord2[1] - coord3[1]);
  const b = Math.hypot(coord1[0] - coord3[0], coord1[1] - coord3[1]);
  const c = Math.hypot(coord1[0] - coord2[0], coord1[1] - coord2[1]);
  const ix = (a * coord1[0] + b * coord2[0] + c * coord3[0]) / (a + b + c);
  const iy = (a * coord1[1] + b * coord2[1] + c * coord3[1]) / (a + b + c);
  return [ix, iy];

  // thanks gemini for the formula i never seen before in my life
}

let viewport = null;
let app = null;
function create_rect3(i, coord, viewport, color, prefix) {
  const rect = new Graphics();
  let circles = [];
  let circles_start = [];
  if (i == 0) {
    rect.rect(coord[0], coord[1], 700, 700);
    circles_start = [coord[0] + 150, coord[1] + 150];
  } else if (i == 1) {
    rect.rect(coord[0] - 700, coord[1], 700, 700);
    circles_start = [coord[0] - 550, coord[1] + 150];
  } else if (i == 2) {
    rect.rect(coord[0] - 700, coord[1] - 700, 700, 700);
    circles_start = [coord[0] - 550, coord[1] - 550];
  } else {
    rect.rect(coord[0], coord[1] - 700, 700, 700);
    circles_start = [coord[0] + 150, coord[1] - 550];
  }

  rect.fill({ color: color }).stroke({ color: 0x000000, width: 8 });

  viewport.addChild(rect);
  for (let j = 0; j < 2; j++) {
    for (let k = 0; k < 2; k++) {
      const circle = new Graphics();
      circle
        .circle(
          circles_start[0] + 50 + j * 300,
          circles_start[1] + 50 + k * 300,
          50,
        )
        .fill({ color: 0xffffff })
        .stroke({ color: 0x000000, width: 4 });
      circles.push(circle);
      viewport.addChild(circle);
      COORDS[`${prefix}-${j * 2 + k}`] = [
        circles_start[0] + 50 + j * 300,
        circles_start[1] + 50 + k * 300,
      ];
    }
  }
}
function create_tri(i, coord, viewport, color, type = "normal", tag) {
  const tri = new Graphics();
  const circle = new Graphics();
  //use incenter to place the circle in triangle
  let incenter_coord = [];
  if (i == 0) {
    tri.poly(
      [
        coord[0],
        coord[1],
        coord[0],
        coord[1] + 300,
        coord[0] + 300,
        coord[1] + 300,
      ],
      true,
    );
    incenter_coord = incenter(
      coord,
      [coord[0], coord[1] + 300],
      [coord[0] + 300, coord[1] + 300],
    );
    circle.circle(incenter_coord[0], incenter_coord[1], 50);
  } else if (i == 1) {
    tri.poly(
      [
        coord[0],
        coord[1],
        coord[0] - 300,
        coord[1],
        coord[0] - 300,
        coord[1] + 300,
      ],
      true,
    );
    incenter_coord = incenter(
      coord,
      [coord[0] - 300, coord[1]],
      [coord[0] - 300, coord[1] + 300],
    );
    circle.circle(incenter_coord[0], incenter_coord[1], 50);
  } else if (i == 2) {
    tri.poly(
      [
        coord[0],
        coord[1],
        coord[0],
        coord[1] - 300,
        coord[0] - 300,
        coord[1] - 300,
      ],
      true,
    );
    incenter_coord = incenter(
      coord,
      [coord[0], coord[1] - 300],
      [coord[0] - 300, coord[1] - 300],
    );
    circle.circle(incenter_coord[0], incenter_coord[1], 50);
  } else {
    tri.poly(
      [
        coord[0],
        coord[1],
        coord[0] + 300,
        coord[1],
        coord[0] + 300,
        coord[1] - 300,
      ],
      true,
    );
    incenter_coord = incenter(
      coord,
      [coord[0] + 300, coord[1]],
      [coord[0] + 300, coord[1] - 300],
    );
    circle.circle(incenter_coord[0], incenter_coord[1], 50);
  }
  if (type == "normal") {
    tri.fill({ color: color });
    COORDS[tag] = [incenter_coord[0], incenter_coord[1]];
  } else {
    tri.fill({ color: color }).stroke({ color: 0x000000, width: 8 });
    COORDS[`${tag}-exit`] = [incenter_coord[0], incenter_coord[1]];
  }
  circle.fill({ color: 0xffffff }).stroke({ color: 0x000000, width: 4 });

  viewport.addChild(tri);
  viewport.addChild(circle);
}

$("#message-container").hide();
function toast_message(message) {
  $("#message-content").html(message);
  $("#message-container").css("opacity", 0);
  $("#message-container").show();
  $("#message-container").animate(
    {
      opacity: 1,
    },
    400,
  );
  setTimeout(() => {
    $("#message-container").animate(
      {
        opacity: 0,
      },
      400,
      function () {
        $("#message-container").hide();
      },
    );
  }, 4000);
}

// toast_message("Testing message! soething something something something something"); //debugging

async function init() {
  // Create a new application
  app = new Application();

  // Initialize the application
  await app.init({ background: "#dce4f5", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // create viewport
  viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,
    events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  });

  //debugging box
  // const graphics = new Graphics();
  // graphics.poly([200, 200, 0, 0, -200, 200], true).fill({ color: 0x8FB9A8 });
  // viewport.addChild(graphics);

  // add the viewport to the stage

  // generate game board using pixi.js

  // draw center
  const CENTER_TRI_POINTS = [
    [200, 200],
    [-200, 200],
    [-200, -200],
    [200, -200],
    [200, 200],
  ];

  const CENTER_RECT_POINTS = [
    [-100, 200, 200, 1300],
    [-1500, -100, 1300, 200],
    [-100, -1500, 200, 1300],
    [200, -100, 1300, 200],
  ];
  // draw shortcut lines
  const SHORTCUT_POINTS = [
    [715, 715],
    [-715, 715],
    [-715, -715],
    [715, -715],
  ];
  for (let i = 0; i < 4; i++) {
    const coord1 = [SHORTCUT_POINTS[i][0], SHORTCUT_POINTS[i][1]];
    const coord2 = [
      SHORTCUT_POINTS[(i + 1) % 4][0],
      SHORTCUT_POINTS[(i + 1) % 4][1],
    ];
    let ccoord = [coord1[0], coord1[1]];
    for (let j = 0; j < 22; j++) {
      const line = new Graphics();
      line.moveTo(ccoord[0], ccoord[1]);
      ccoord[0] += (coord2[0] - coord1[0]) / 22;
      ccoord[1] += (coord2[1] - coord1[1]) / 22;
      line.lineTo(ccoord[0], ccoord[1]);
      line.stroke({ width: 10, color: COLOR_HEX[(i + 2) % 4] });

      if (j % 2 == 0) {
        viewport.addChild(line);
      }
    }
  }

  // draw center base path
  for (let i = 0; i < 4; i++) {
    const triangle = new Graphics();
    triangle
      .poly(
        [
          CENTER_TRI_POINTS[i][0],
          CENTER_TRI_POINTS[i][1],
          0,
          0,
          CENTER_TRI_POINTS[i + 1][0],
          CENTER_TRI_POINTS[i + 1][1],
        ],
        true,
      )
      .fill({ color: COLOR_HEX[i] });
    viewport.addChild(triangle);

    const rect = new Graphics();
    rect
      .rect(
        CENTER_RECT_POINTS[i][0],
        CENTER_RECT_POINTS[i][1],
        CENTER_RECT_POINTS[i][2],
        CENTER_RECT_POINTS[i][3],
      )
      .fill({ color: COLOR_HEX[i] });
    viewport.addChild(rect);
  }

  //draw circles for each row
  for (let i = 0; i < 4; i++) {
    // yellow
    let orig_coord = [0, -150];
    for (let j = 0; j < i; j++) {
      orig_coord = [-orig_coord[1], orig_coord[0]];
    }
    // hangar path circles

    for (let j = 0; j < 7; j++) {
      const circle = new Graphics();
      circle
        .circle(orig_coord[0], orig_coord[1], 50)
        .fill({ color: 0xffffff })
        .stroke({ color: 0x000000, width: 4 });
      viewport.addChild(circle);
      if (j != 6) {
        COORDS[
          COLORS[(i + 2) % 4].substring(0, 1).toUpperCase() + "H-" + (6 - j)
        ] = [orig_coord[0], orig_coord[1]];
      }

      if (i == 0) {
        orig_coord[1] -= 200;
      } else if (i == 1) {
        orig_coord[0] += 200;
      } else if (i == 2) {
        orig_coord[1] += 200;
      } else {
        orig_coord[0] -= 200;
      }
    }
  }
  // const newrect = new Graphics(); //debugging to make sure i got my sizing right
  // newrect.rect(-300, -1500, 200, 300).fill({ color: 0xff0000 });
  // viewport.addChild(newrect);

  // total space is 1400 = 200 * 4 (horizontal) + 300 * 2 (vertical)
  // tile dimenstions are 200 x 300 and circles have radius 50

  // the rest of the game board
  let count = 1;
  for (let i = 0; i < 4; i++) {
    //start with yellow because its easiest lol
    let coord = [100, -1500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_rect1(i, coord, viewport, COLOR_HEX[(i + 3) % 4], "M-" + count++);

    coord = [300, -1500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_rect1(i, coord, viewport, COLOR_HEX[(i + 4) % 4], "M-" + count++);

    //first triangle corner
    coord = [500, -1500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }

    create_tri(
      i,
      coord,
      viewport,
      COLOR_HEX[(i + 5) % 4],
      "normal",
      "M-" + count++,
    );

    // first horizontal rectangle column
    coord = [500, -1200];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_rect2(i, coord, viewport, COLOR_HEX[(i + 6) % 4], "M-" + count++);

    coord = [500, -1000];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }

    create_rect2(i, coord, viewport, COLOR_HEX[(i + 7) % 4], "M-" + count++);

    // second triangle corner -> its a double
    coord = [800, -800];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }

    create_tri(
      (i + 1) % 4,
      coord,
      viewport,
      COLOR_HEX[(i + 8) % 4],
      "normal",
      "M-" + count++,
    );

    coord = [500, -500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_tri(
      (i + 3) % 4,
      coord,
      viewport,
      COLOR_HEX[(i + 9) % 4],
      "normal",
      "M-" + count++,
    );

    // second vertical rectangle row
    coord = [800, -800];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_rect1(i, coord, viewport, COLOR_HEX[(i + 10) % 4], "M-" + count++);

    coord = [1000, -800];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_rect1(i, coord, viewport, COLOR_HEX[(i + 11) % 4], "M-" + count++);

    // final triangle corner
    coord = [1200, -800];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_tri(
      i,
      coord,
      viewport,
      COLOR_HEX[(i + 12) % 4],
      "normal",
      "M-" + count++,
    );

    // final horizontal rectangle column
    coord = [1200, -500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }

    create_rect2(i, coord, viewport, COLOR_HEX[(i + 13) % 4], "M-" + count++);

    coord = [1200, -300];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_rect2(i, coord, viewport, COLOR_HEX[(i + 14) % 4], "M-" + count++);

    // add bases
    coord = [800, -1500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_rect3(
      i,
      coord,
      viewport,
      COLOR_HEX[(i + 14) % 4],
      COLORS[(i + 2) % 4].substring(0, 1).toUpperCase(),
    );

    // base launch areas
    coord = [800, -1200];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_tri(
      (i + 2) % 4,
      coord,
      viewport,
      COLOR_HEX[(i + 14) % 4],
      "base",
      COLORS[(i + 2) % 4].substring(0, 1).toUpperCase(),
    );

    const mid_coord = [
      i % 2 == 0 ? 1350 * (i - 1) * -1 : 0,
      i % 2 == 0 ? 0 : 1350 * (i - 2) * -1,
    ];
    COORDS["M-" + count++] = mid_coord;
    // TODO: Clean up to make this more efficient bcs tf is this bro -> done
    // TODO: Add circles
  }
  //debugging coords
  // const style = new TextStyle({
  //   fontFamily: "Arial",
  //   fontSize: 36,
  //   fill: "0x000000",
  //   wordWrap: true,
  //   wordWrapWidth: 400,
  // });
  // for (let key of Object.keys(COORDS)) {
  //   const text = new Text({ text: key, style: style });
  //   text.x = COORDS[key][0] - 35;
  //   text.y = COORDS[key][1] - 25;
  //   viewport.addChild(text);
  // }

  app.stage.addChild(viewport);
  viewport.drag().pinch().wheel().decelerate();

  viewport.moveCenter(0, 0);
  viewport.setZoom(0.27);
  viewport.clampZoom({ minScale: 0.15, maxScale: 1 });
}
let dice_roll = null;

window.onload = function () {
  const EXIT_LOCATIONS = [26, 39, 52, 13];
  const START_LOCATIONS = [28, 41, 2, 15];
  // Hnalding home screen functionality

  $("#joincode").on("input", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, ""),
    );

    if ($(this).val().length > 6) {
      $(this).val($(this).val().substring(0, 6));
    }
  });

  $("#join").on("click", function () {
    $("#jcontainer").css("opacity", "0");
    $("#jcontainer").show();
    $("#jcontainer").animate(
      {
        opacity: 1,
      },
      250,
    );
  });

  $("#join-close").on("click", function () {
    $("#jcontainer").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#jcontainer").hide();
      },
    );
  });

  $("#jcontainer").hide();
  $("#guide-container").hide();
  $("#pixi-overlay").hide();
  $("#settings-container").hide();

  init().catch((err) => {
    console.error("Error initializing PIXI.js graphics:", err);
  });

  $("#start").prop("disabled", true);
  $("#join").prop("disabled", true);
  $("#find").prop("disabled", true);

  $("#username").on("input", function () {
    if ($(this).val().length == 0) {
      $("#start").prop("disabled", true);
      $("#join").prop("disabled", true);
      $("#find").prop("disabled", true);
    } else {
      $("#start").prop("disabled", false);
      $("#join").prop("disabled", false);
      $("#find").prop("disabled", false);
    }
  });

  // Handling waiting room functionality

  $("#host-actions-container").hide();
  $("#non-host-actions-container").hide();
  $("#game-results").hide();
  let settings_data = {
    visibility: "private",
    max_players: 4,
    even_launch: false,
    home_backtrack: true,
  };
  // start button -> home sc  reen
  $("#start").on("click", function () {
    settings_data = {
      visibility: "private",
      max_players: 4,
      even_launch: false,
      home_backtrack: true,
    };
    $("#ui-layer").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#ui-layer").hide();
      },
    );
    $("#pixi-overlay").css("opacity", 0);
    $("#pixi-overlay").show();
    $("#sidebar-left").hide();
    $("#sidebar-right").hide();
    socket.emit("create-room", { username: $("#username").val() });
    $("#host-actions-container").show();
    $("#non-host-actions-container").hide();
    $("#pixi-overlay").animate(
      {
        opacity: 1,
      },
      250,
    );
  });

  // join button -> home screen

  let wroom_data = null;
  $("#join-button").on("click", function () {
    if ($("#joincode").val().length === 6) {
      socket.emit(
        "join-room",
        {
          username: $("#username").val(),
          room_code: $("#joincode").val(),
        },
        (callback) => {
          if (callback.message == "success") {
            // successfully joined room
            toast_message(
              "Successfully joined room with code <strong>" +
                $("#joincode").val() +
                "</strong>",
            );
            $("#ui-layer").animate(
              {
                opacity: 0,
              },
              250,
              function () {
                $("#ui-layer").hide();
              },
            );
            $("#wr-settings").hide();
            $("#pixi-overlay").css("opacity", 0);
            $("#pixi-overlay").show();
            $("#sidebar-left").hide();
            $("#jcontainer").hide();

            $("#sidebar-right").hide();
            $("#pixi-overlay").animate(
              {
                opacity: 1,
              },
              250,
            );
            $("#host-actions-container").hide();
            $("#non-host-actions-container").show();
          } else {
            $("#message").text(callback.message);
            $("#message").show();
          }
        },
      );
    } else {
      $("#message").text("Please enter a valid 6-digit room code.");
      $("#message").show();
    }
  });

  // listening for waiting room updates
  socket.on("waiting-room-update", (room_data) => {
    console.log("Received waiting room update:", room_data);
    wroom_data = room_data;
    $("#join-code").text(room_data.code);
    if (room_data.players.length == 0) {
      //return to home screen;
      $("#host-actions-container").hide();
      $("#non-host-actions-container").hide();
      $("#ui-layer").show();
      $("#ui-layer").animate(
        {
          opacity: 1,
        },
        250,
      );
      $("#pixi-overlay").animate(
        {
          opacity: 0,
        },
        250,
        function () {
          $("#pixi-overlay").hide();
          $("#sidebar-left").show();
          $("#sidebar-right").show();
        },
      );

      return;
    }
    if (room_data.players[0].id == socket.id) {
      if (room_data.players.length >= 2) {
        $("#start-game").prop("disabled", false);
      } else {
        $("#start-game").prop("disabled", true);
      }
    }
    for (let i = 0; i < 4; i++) {
      if (room_data.players[i]) {
        $("#w-p" + (i + 1) + "-card").removeClass("user-waiting");
        $("#w-p" + (i + 1) + "-card").addClass("user-ready");
        $("#w-p" + (i + 1) + "-status").html(
          `<i class="fa-solid fa-check"></i>`,
        );

        $("#w-p" + (i + 1) + "-name").text(room_data.players[i].username);
      } else {
        $("#w-p" + (i + 1) + "-card").removeClass("user-ready");
        $("#w-p" + (i + 1) + "-card").addClass("user-waiting");
        $("#w-p" + (i + 1) + "-status").html(
          `<i class="fa-regular fa-clock"></i>`,
        );
        $("#w-p" + (i + 1) + "-name").text("Waiting...");
      }
    }

    // check if player was kicked
    if (
      room_data.players.filter((player) => player.id == socket.id).length == 0
    ) {
      // return to home screen
      $("#host-actions-container").hide();
      $("#non-host-actions-container").hide();
      $("#ui-layer").show();
      $("#ui-layer").animate(
        {
          opacity: 1,
        },
        250,
      );
      $("#pixi-overlay").animate(
        {
          opacity: 0,
        },
        250,
        function () {
          $("#pixi-overlay").hide();
          $("#sidebar-left").show();
          $("#sidebar-right").show();
        },
      );
      toast_message("You have been removed from the room by the host");
    }
  });

  //copy code
  $("#copy-code").on("click", function () {
    const code = wroom_data.code;
    navigator.clipboard.writeText(code).then(() => {
      console.log("room code copied to clipboard");
      $(this).animate({ opacity: 0 }, 250, function () {
        $(this).removeClass("ph-copy");
        $(this).addClass("ph-check");
        $(this).animate({ opacity: 1 }, 250, function () {
          setTimeout(() => {
            $(this).animate({ opacity: 0 }, 250, function () {
              $(this).removeClass("ph-check");
              $(this).addClass("ph-copy");
              $(this).animate({ opacity: 1 }, 250);
            });
          }, 1000);
        });
      });
    });
  });

  //leave game -> non-host waiting room
  $("#leave-game").on("click", function () {
    socket.emit("leave-room");
    $("#host-actions-container").hide();
    $("#non-host-actions-container").hide();
    $("#ui-layer").show();
    $("#ui-layer").animate(
      {
        opacity: 1,
      },
      250,
    );
    $("#pixi-overlay").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#pixi-overlay").hide();
        $("#sidebar-left").show();
        $("#sidebar-right").show();
      },
    );
  });

  // cancel game -> host only waiting room
  $("#cancel-game").on("click", function () {
    socket.emit("leave-room");
    $("#host-actions-container").hide();
    $("#non-host-actions-container").hide();
    $("#ui-layer").show();
    $("#ui-layer").animate(
      {
        opacity: 1,
      },
      250,
      function () {
        $("#pixi-overlay").animate(
          {
            opacity: 0,
          },
          250,
          function () {
            $("#pixi-overlay").hide();
            $("#sidebar-left").show();
            $("#sidebar-right").show();
          },
        );
      },
    );
  });
  // start game -> host only waiting room
  $("#start-game").on("click", function () {
    socket.emit("start-game");
  });
  let player_sprites = [];
  let game_data = null;
  // game start listener
  socket.on("game-start", (room_data) => {
    game_data = room_data;

    // make sure everything is hidden
    $("#ui-layer").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#ui-layer").hide();
      },
    );
    $("#find-container").animate(
      {
        opacity: 0,
      },
      500,
      function () {
        $("#find-container").hide();
      },
    );
    $("#pixi-overlay").css("opacity", 0);
    $("#pixi-overlay").show();
    $("#jcontainer").hide();
    $("#pixi-overlay").animate(
      {
        opacity: 1,
      },
      250,
    );
    $("#waiting-room-container").hide();
    $("#wr-settings").show();
    $("#sidebar-left").show();
    $("#sidebar-right").show();
    viewport.animate({
      scaleX: 0.25,
      scaleY: 0.25,
      time: 1000,
    });
    // check if spectator
    if (
      game_data.players.filter((player) => player.id == socket.id).length == 0
    ) {
      $("#spectator-info-container").css("opacity", 0);
      $("#spectator-info-container").show();
      $("#spectator-info-container").animate(
        {
          opacity: 1,
        },
        500,
      );
    }
    // create sprites

    for (let i = 0; i < room_data.players.length; i++) {
      let player = [];
      for (let j = 0; j < 4; j++) {
        const graphic = new Graphics();
        const coord = COORDS[`${COLORS[i].substring(0, 1).toUpperCase()}-${j}`];
        graphic.circle(0, 0, 45).fill({ color: COLOR_HEX[i] });
        const texture = app.renderer.generateTexture(graphic);
        const sprite = new Sprite(texture);
        sprite.position.set(coord[0] - 45, coord[1] - 45);
        viewport.addChild(sprite);
        player.push(sprite);
        sprite.eventMode = "static";
        if (room_data.players[i].id == socket.id) {
          sprite.on("pointerover", () => {
            sprite.alpha = 0.7;
          });

          sprite.on("pointerout", () => {
            sprite.alpha = 1;
          });
        }
        sprite.on("click", () => {
          console.log(game_data);
          console.log(game_data.turn);
          if (
            game_data.players[game_data.turn].id == socket.id &&
            $("#roll-dice").prop("disabled") == true &&
            game_data.players[i].id == socket.id
          ) {
            // make sure its the right players turn and they have rolled the dice and they are clicking on their own piece
            if (game_data.players[i].pieces[j].status == "home") {
              // need a six to get out
              console.log(game_data.settings.even_launch ? [2, 4, 6] : [6]);
              console.log("----------");
              if (
                (game_data.settings.even_launch ? [2, 4, 6] : [6]).includes(
                  dice_roll,
                )
              ) {
                socket.emit("move-piece", {
                  piece: j,
                  player: i,
                  roll: dice_roll,
                });
              }
            } else {
              socket.emit("move-piece", {
                piece: j,
                player: i,
                roll: dice_roll,
              });
            }
          }
        });
      }
      player_sprites.push(player);
    }
  });

  // next move game listener
  socket.on("game-update", (room_data) => {
    game_data = room_data;

    console.log(game_data);
    $("#spectators-count").text(game_data.spectators.length);
    // check if move is for current player
    $("#turn-status-container").css(
      "background-color",
      COLOR_HEX[game_data.turn],
    );
    if (game_data.update == true) {
      if (game_data.players[game_data.turn].id == socket.id) {
        console.log("dice change");
        $("#roll-dice").prop("disabled", false);
        $("#turn-status").text("Your Turn");
      } else {
        $("#roll-dice").prop("disabled", true);
        $("#turn-status").html(
          "Waiting on <strong>" +
            game_data.players[game_data.turn].username +
            "</strong>",
        );
      }
    }

    //update move history log UI
    if ($("#move-history").children().length < game_data.history.length) {
      console.log(game_data.history);
      for (
        let i = $("#move-history").children().length;
        i < game_data.history.length;
        i++
      ) {
        console.log(game_data.history[i]);
        let icon = `<i class="ph ph-sword"></i>`;
        if (game_data.history[i].type == "move") {
          icon = `<i class="ph ph-paper-plane"></i>`;
        } else if (game_data.history[i].type == "activate") {
          icon = `<i class="ph ph-rocket-launch"></i>`;
        } else if (game_data.history[i].type == "skip") {
          icon = "<i class='ph ph-skip-forward'></i>";
        } else if (game_data.history[i].type == "repeat") {
          icon = "<i class='ph ph-repeat'></i>";
        } else if (game_data.history[i].type == "win") {
          icon = "<i class='ph ph-trophy'></i>";
        }
        $("#move-history").prepend(
          `<div class="move-history-item">
                <div class="player-icon ${COLORS[game_data.history[i].color]}">
                  ${icon}
                </div>
                <p>${game_data.history[i].text}</p>
          </div>`,
        );
      }
    }

    // update player information

    for (let i = 0; i < 4; i++) {
      if (game_data.players[i]) {
        $("#p" + (i + 1) + "-name").text(game_data.players[i].username);
        if (game_data.players[i].id == socket.id) {
          $("#p" + (i + 1) + "-name").text(
            game_data.players[i].username + " (You)",
          );
        }
      } else {
        $("#p" + (i + 1) + "-card").hide();
      }
    }

    //update pieces
    for (let i = 0; i < 4; i++) {
      if (game_data.players[i]) {
        for (let j = 0; j < 4; j++) {
          const piece = game_data.players[i].pieces[j];
          const sprite = player_sprites[i][j];
          sprite.position.set(
            COORDS[piece.location][0] - 45,
            COORDS[piece.location][1] - 45,
          );
          if (piece.status == "finished") {
            sprite.visible = false;
          }

          // dynamically update ui element
          if (piece.status == "home") {
            $(`#p${i + 1}-piece-${j}-status`).html(
              `<i class="ph ph-warehouse"></i>`,
            );
          } else if (piece.location.includes("exit")) {
            $(`#p${i + 1}-piece-${j}-status`).html(
              `<i class="ph ph-airplane-taxiing"></i>`,
            );
          } else if (piece.location.includes("H")) {
            $(`#p${i + 1}-piece-${j}-status`).html(
              `<i class="ph ph-airplane-landing"></i>`,
            );
          } else if (piece.status == "active") {
            $(`#p${i + 1}-piece-${j}-status`).html(
              `<i class="ph ph-airplane-in-flight"></i>`,
            );
          } else {
            $(`#p${i + 1}-piece-${j}-status`).html(
              `<i class="ph ph-check"></i>`,
            );
          }
          //progress bar
          const TOTAL = 57;
          let progress = 0;
          if (piece.status == "home") {
            progress = 0;
          } else if (piece.status == "finished") {
            progress = 57;
          } else if (piece.location.includes("exit")) {
            progress = 0;
          } else if (piece.status == "active") {
            let loc = parseInt(piece.location.split("-")[1]);
            if (piece.location.includes("H")) {
              loc = 51 + loc;
            }
            if (i == 2) {
              progress = loc - 1;
            } else {
              if (loc > EXIT_LOCATIONS[i]) {
                progress = loc - START_LOCATIONS[i];
              } else {
                progress = 52 - START_LOCATIONS[i] + loc;
              }
            }
          }
          $(`#p${i + 1}-piece-${j}-progress`).css(
            "height",
            (progress / TOTAL) * 100 + "%",
          );
        }
      } else {
        if (i < player_sprites.length) {
          for (let j = 0; j < 4; j++) {
            const sprite = player_sprites[i][j];
            sprite.visible = false;
          }
        }
      }
    }
  });

  //handle dice roll
  let spins = 0;
  const faceRotations = {
    1: [0, 0],
    6: [0, 180],
    2: [0, -90],
    5: [0, 90],
    4: [-90, 0],
    3: [90, 0],
  };
  $("#roll-dice").on("click", function () {
    dice_roll = Math.floor(Math.random() * 6) + 1;
    const [rx, ry] = faceRotations[dice_roll];

    spins += 2;
    $("#die").css(
      "transform",
      `rotateX(${rx + spins * 360}deg) rotateY(${ry + spins * 360}deg)`,
    );

    // dice_roll = 6; // debugging purposes
    // $("#dice-result").css("opacity", 0);
    // $("#dice-result").text(dice_roll);
    // $("#dice-result").animate({ opacity: 1 }, 250);
    $(this).prop("disabled", true);
    setTimeout(() => {
      // check for no possible moves and skip turn if necessary
      let possible_move = false;
      for (
        let i = 0;
        i < game_data.players[game_data.turn].pieces.length;
        i++
      ) {
        if (
          game_data.players[game_data.turn].pieces[i].status != "home" &&
          game_data.players[game_data.turn].pieces[i].status != "finished"
        ) {
          possible_move = true;
        }
      }

      if (
        possible_move == false &&
        !(game_data.settings.even_launch ? [2, 4, 6] : [6]).includes(dice_roll)
      ) {
        socket.emit("skip-turn");
      }
    }, 1000);
  });
  // dynamically create sidebar UI
  const COLORS = ["green", "red", "yellow", "blue"];
  const COLOR_HEX = ["#8FB9A8", "#EE6C4D", "#F4D35E", "#4e7dba"];
  for (let i = 1; i <= 4; i++) {
    $(".players-list-container").append(`
      <div class="player-card2" id="p${i}-card">
        <div class="player-icon-container">
          <div class="user-icon">
            <i class="ph ph-user"></i>
          </div>
          <p id="p${i}-name" style="text-align:center">Player ${i}</p>
        </div>
        <div class="player-piece-container" id="p${i}-piece-container"></div>
      </div>`);
    for (let j = 0; j < 2; j++) {
      $("#p" + i + "-piece-container").append(`
        <div class="player-piece-subcontainer" id="p${i}-sub-${j}">
        </div>
      `);
    }
    for (let k = 0; k < 4; k++) {
      $("#p" + i + "-sub-" + Math.floor(k / 2)).append(`
        <div class="player-piece ${COLORS[i - 1]}" id="p${i}-piece-${k}">
          <i class="ph ph-paper-plane"></i>
          <div class="piece-progress-bar">
            <div id="p${i}-piece-${k}-progress"
              class="piece-progress-fill"
              style="height: 0%"
            ></div>
          </div>
          <div class="piece-status-indictator" id="p${i}-piece-${k}-status">
            <i class="ph ph-airplane-taxiing"></i>
          </div>
        </div>
      `);
      $(`#p${i}-piece-${k}`).on("click", function () {
        if (game_data.players[i - 1]) {
          const piece = game_data.players[i - 1].pieces[k];
          if (piece.status != "finished") {
            const loc = COORDS[piece.location];
            viewport.animate({
              position: new Point(loc[0], loc[1]),
              time: 1000,
              scale: 0.9,
              ease: "easeInOutSine",
            });
          }
        }
      });
    }
  }
  // handle sudden game end -> rank based on piece completed + progress
  socket.on("game-end-sudden", (data) => {
    $("#game-results").show();
    $("#rmessage").text(data.message);
    for (let i = 0; i < data.players.length; i++) {
      let sum_score = 0;
      for (let j = 0; j < data.players[i].pieces.length; j++) {
        let piece = data.players[i].pieces[j];
        if (data.players[i].pieces[j].status == "finished") {
          sum_score += 57;
        } else if (data.players[i].pieces[j].status == "active") {
          let loc = parseInt(piece.location.split("-")[1]);
          if (piece.location.includes("H")) {
            loc = 51 + loc;
          }
          if (i == 2) {
            sum_score += loc - 1;
          } else {
            if (loc > EXIT_LOCATIONS[i]) {
              sum_score += loc - START_LOCATIONS[i];
            } else {
              sum_score += 52 - START_LOCATIONS[i] + loc;
            }
          }
        }
      }
      if (data.players[i].finish_count != -1) {
        sum_score += data.turn - data.players[i].finish_count;
      }
      sum_score += data.players[i].stats.captures;
      sum_score += data.players[i].stats.jumps;
      sum_score += data.players[i].stats.sixs;
      data.players[i].score = sum_score;
    }

    let sorted_players = data.players.sort((a, b) => {
      return b.score - a.score;
    });
    const RANK_COLORS = ["gold", "silver", "bronze", ""];
    for (let i = 0; i < sorted_players.length; i++) {
      $("#results-content").append(`
        <div class="results-card">
          <div class="rcard-icon ${sorted_players[i].color}">
            <div class="results-rank-icon ${RANK_COLORS[i]}">
              <p>${i + 1}</p>
            </div>
            <i class="ph ph-user"></i>
          </div>
          <p class="rcard-pname">${sorted_players[i].username}</p>
          <div class="vertical-line"></div>
          <div class="stats">
            <div class="rstat">
              <p>PLANES   </p>
              <div class="stat-items" id="p${i}-stat-items">
              </div>
            </div>
            <div class="rstat">
              <p>TOTAL JUMPS</p>
              <h1>${sorted_players[i].stats.jumps}x</h1>
            </div>
            <div class="rstat">
              <p>TOTAL CAPTURES</p>
              <h1>${sorted_players[i].stats.captures}x</h1>
            </div>
            <div class="rstat">
              <p>SIXS ROLLED</p>
              <h1>${sorted_players[i].stats.sixs}x</h1>
            </div>
          </div>
        </div>`);
      for (let j = 0; j < 4; j++) {
        let style = `style="opacity:${sorted_players[i].pieces[j].status == "finished" ? 1 : 0.5}"`;
        let icon = `<i class="ph ph-trophy"></i>`;
        if (sorted_players[i].pieces[j].status == "home") {
          icon = `<i class="ph ph-warehouse"></i>`;
        } else if (sorted_players[i].pieces[j].status == "active") {
          icon = `<i class="ph ph-airplane-in-flight"></i>`;
        }
        $("#p" + i + "-stat-items").append(`
        <div class="stat-plane ${sorted_players[i].color}" ${style}>
          ${icon}
        </div>`);
      }
    }
  });

  // handle game end
  socket.on("game-end", (data) => {
    $("#game-results").show();
    $("#rmessage").text(data.message);

    let sorted_players = data.players.sort((a, b) => {
      return a.finish_count - b.finish_count;
    });
    const RANK_COLORS = ["gold", "silver", "bronze", ""];
    for (let i = 0; i < sorted_players.length; i++) {
      $("#results-content").append(`
        <div class="results-card">
          <div class="rcard-icon ${sorted_players[i].color}">
            <div class="results-rank-icon ${RANK_COLORS[i]}">
              <p>${i + 1}</p>
            </div>
            <i class="ph ph-user"></i>
          </div>
          <p class="rcard-pname">${sorted_players[i].username}</p>
          <div class="vertical-line"></div>
          <div class="stats">
            <div class="rstat">
              <p>PLANES   </p>
              <div class="stat-items" id="p${i}-stat-items">
              </div>
            </div>
            <div class="rstat">
              <p>TOTAL JUMPS</p>
              <h1>${sorted_players[i].stats.jumps}x</h1>
            </div>
            <div class="rstat">
              <p>TOTAL CAPTURES</p>
              <h1>${sorted_players[i].stats.captures}x</h1>
            </div>
            <div class="rstat">
              <p>SIXS ROLLED</p>
              <h1>${sorted_players[i].stats.sixs}x</h1>
            </div>
          </div>
        </div>`);
      for (let j = 0; j < 4; j++) {
        let style = `style="opacity:${sorted_players[i].pieces[j].status == "finished" ? 1 : 0.5}"`;
        let icon = `<i class="ph ph-trophy"></i>`;
        if (sorted_players[i].pieces[j].status == "home") {
          icon = `<i class="ph ph-warehouse"></i>`;
        } else if (sorted_players[i].pieces[j].status == "active") {
          icon = `<i class="ph ph-airplane-in-flight"></i>`;
        }
        $("#p" + i + "-stat-items").append(`
        <div class="stat-plane ${sorted_players[i].color}" ${style}>
          ${icon}
        </div>`);
      }
    }
  });

  // return to home screen
  $("#g-return").on("click", function () {
    $("#game-results").hide();
    $("#sidebar-left").hide();
    $("#sidebar-right").hide();
    $("#pixi-overlay").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#pixi-overlay").hide();
        $("#waiting-room-container").show();
      },
    );
    $("#ui-layer").css("opacity", 0);
    $("#ui-layer").show();
    $("#ui-layer").animate(
      {
        opacity: 1,
      },
      250,
    );
    viewport.moveCenter(0, 0);
    viewport.setZoom(0.27);
  });

  // handle chat features
  let message_history = [];

  $("#chat-input").on("input", function (e) {
    $("#char-count").text($(this).val().length + "/50");
    if ($(this).val().length > 0) {
      // autocomplete options
      let possible_words = [];
      for (let i = 0; i < AUTOCOMPLETE_MESSAGES.length; i++) {
        if (
          AUTOCOMPLETE_MESSAGES[i]
            .toLowerCase()
            .startsWith($(this).val().toLowerCase())
        ) {
          possible_words.push(AUTOCOMPLETE_MESSAGES[i]);
        }
      }
      $("#quick-chat-container").html("");
      for (let i = 0; i < possible_words.length; i++) {
        $("#quick-chat-container").append(`
          <button class="quick-chat">${possible_words[i]}</button>
          `);
      }
      $(".quick-chat").on("click", function () {
        $("#chat-input").val($(this).text());
        $("#quick-chat-container").html("");
      });
    } else {
      $("#quick-chat-container").html("");
    }
  });

  // watching message send
  $("#chat-send").on("click", function () {
    const message = $("#chat-input").val();
    if (message.trim() !== "") {
      socket.emit("send-chat", { message: message });
      $("#chat-input").val("");
      $("#char-count").text("0/50");
    }
  });

  //watching message recieve
  socket.on("recieve-chat", (data) => {
    const message = data.message;
    const sender = data.username;
    const uid = data.id;
    console.log(data);
    if (message_history.length == 0) {
      $("#messages").append(`
      <div class="message-container ${uid == socket.id ? "self" : ""}">
        <div class="username-container">
          <p class="username">${sender.toUpperCase()}</p>
          <div class="username-tag ${data.type == "spectator" ? "spectator" : data.color}">
            <p>${data.type == "spectator" ? "Spectator" : "Player"}</p>
          </div>
        </div>
        <div class="message">
          <p>${message}</p>
        </div>
      </div>`);
    } else {
      $("#messages").append(`
      <div class="message-container ${uid == socket.id ? "self" : ""}">
        ${
          message_history[message_history.length - 1].id != uid
            ? `
        <div class="username-container">
          <p class="username">${sender.toUpperCase()}</p>
          <div class="username-tag ${data.type == "spectator" ? "spectator" : data.color}">
            <p>${data.type == "spectator" ? "Spectator" : "Player"}</p>
          </div>
        </div>
        `
            : ""
        }
        <div class="message">
          <p>${message}</p>
        </div>
      </div>`);
    }

    message_history.push({ sender: sender, message: message, id: uid });
  });

  // How to play guide functionality
  let page = 1;
  $("#info").on("click", function () {
    $("#guide-container").css("opacity", 0);
    $("#guide-container").css("display", "flex");
    $("#guide-container").animate(
      {
        opacity: 1,
      },
      500,
    );
    page = 1;
    $("#g-next").prop("disabled", false);
    $("#g-back").prop("disabled", true);
    $("#g-stitle").text(GUIDE_PAGES[page - 1].title);
    $("#g-info").text(GUIDE_PAGES[page - 1].description);
    $("#g-count").text(page + "/4");
    $("#g-img").attr("src", "./assets/guide/" + GUIDE_PAGES[page - 1].image);
  });

  $("#g-next").on("click", function () {
    page += 1;
    if (page > 4) {
      page = 4;
    }

    if (page == 4) {
      $("#g-next").prop("disabled", true);
    } else {
      $("#g-next").prop("disabled", false);
    }
    $("#g-back").prop("disabled", false);

    $("#gc-row").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#g-stitle").text(GUIDE_PAGES[page - 1].title);
        $("#g-info").text(GUIDE_PAGES[page - 1].description);
        $("#g-count").text(page + "/4");
        $("#g-img").attr(
          "src",
          "./assets/guide/" + GUIDE_PAGES[page - 1].image,
        );
        $("#gc-row").animate({ opacity: 1 }, 250);
      },
    );
  });

  $("#g-back").on("click", function () {
    page -= 1;
    if (page < 1) {
      page = 1;
    }

    if (page == 1) {
      $("#g-back").prop("disabled", true);
    } else {
      $("#g-back").prop("disabled", false);
    }
    $("#g-next").prop("disabled", false);

    $("#gc-row").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#g-stitle").text(GUIDE_PAGES[page - 1].title);
        $("#g-info").text(GUIDE_PAGES[page - 1].description);
        $("#g-count").text(page + "/4");
        $("#g-img").attr(
          "src",
          "./assets/guide/" + GUIDE_PAGES[page - 1].image,
        );
        $("#gc-row").animate({ opacity: 1 }, 250);
      },
    );
  });

  // return back to main menu
  $("#g-return2").on("click", function () {
    console.log("r");
    $("#guide-container").animate(
      {
        opacity: 0,
      },
      500,
      function () {
        $("#guide-container").hide();
      },
    );
  });

  // Handle waiing room settings functionality (HOST ONLY)
  $("#wr-settings").on("click", function () {
    $("#settings-container").css("opacity", 0);
    $("#settings-container").css("display", "flex");
    $("#settings-container").animate(
      {
        opacity: 1,
      },
      250,
    );
  });

  $("#wr-settings-close").on("click", function () {
    $("#settings-container").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#settings-container").hide();
      },
    );
  });

  $("#s-visibility").on("click", function () {
    if (settings_data.visibility == "private") {
      settings_data.visibility = "public";
      $("#s-visibility").html("Public");
    } else {
      settings_data.visibility = "private";
      $("#s-visibility").html("Private");
    }
    socket.emit("update-settings", settings_data);
  });

  $("#s-max-players").on("click", function () {
    settings_data.max_players += 1;
    if (settings_data.max_players > 4) {
      settings_data.max_players = 2;
    }
    $("#s-max-players").html(settings_data.max_players);
    socket.emit("update-settings", settings_data);
  });

  $("#s-even-launch").on("click", function () {
    settings_data.even_launch = !settings_data.even_launch;
    $("#s-even-launch").html(
      settings_data.even_launch ? "Enabled" : "Disabled",
    );
    socket.emit("update-settings", settings_data);
  });

  $("#s-homezone").on("click", function () {
    settings_data.home_backtrack = !settings_data.home_backtrack;
    $("#s-homezone").html(
      settings_data.home_backtrack ? "Enabled" : "Disabled",
    );
    socket.emit("update-settings", settings_data);
  });

  // handle public game finding
  socket.on("public-rooms-update", (rooms) => {
    $("#find-list").empty();

    if (rooms.length == 0) {
      $("#find-list").append(`<p>No public games available at the moment</p>`);
    } else {
      for (let i = 0; i < rooms.length; i++) {
        $("#find-list").append(`      
        <div class="find-card">
          <p class="find-name">
            <strong>
              <span id="find-name-span">${String(rooms[i].players[0].username).trim()}</span>
            </strong>'s Game
          </p>
          <div class="find-player-count">
            <p>${rooms[i].players.length}/${rooms[i].settings.max_players} Players</p>
          </div>
          <button style="margin-right:0px;margin-left:auto;" id="find-j-${rooms[i].code}">
          ${rooms[i].state == "active-game" ? "Spectate Game" : "Join Game"}
          </button>
        </div>;
          `);
        $("#find-j-" + rooms[i].code).on("click", function () {
          if (rooms[i].state == "active-game") {
            socket.emit("spectate-game", {
              room_code: rooms[i].code,
              username: $("#username").val(),
            });
          } else {
            socket.emit(
              "join-room",
              {
                username: $("#username").val(),
                room_code: rooms[i].code,
              },
              (callback) => {
                if (callback.message == "success") {
                  // successfully joined room
                  $("#find-container").animate(
                    {
                      opacity: 0,
                    },
                    250,
                    function () {
                      $("#find-container").hide();
                    },
                  );
                  toast_message(
                    "Successfully joined room with code <strong>" +
                      rooms[i].code +
                      "</strong>",
                  );
                  $("#ui-layer").animate(
                    {
                      opacity: 0,
                    },
                    250,
                    function () {
                      $("#ui-layer").hide();
                    },
                  );
                  $("#wr-settings").hide();
                  $("#pixi-overlay").css("opacity", 0);
                  $("#pixi-overlay").show();
                  $("#sidebar-left").hide();
                  $("#jcontainer").hide();

                  $("#sidebar-right").hide();
                  $("#pixi-overlay").animate(
                    {
                      opacity: 1,
                    },
                    250,
                  );
                  $("#host-actions-container").hide();
                  $("#non-host-actions-container").show();
                } else {
                  toast_message(callback.message);
                }
              },
            );
          }
        });
      }
    }
  });
  $("#find-container").hide();

  $("#find").on("click", function () {
    $("#find-container").css("opacity", 0);
    $("#find-container").css("display", "flex");
    $("#find-container").animate(
      {
        opacity: 1,
      },
      500,
    );
    socket.emit("request-public-rooms");
  });

  $("#find-close").on("click", function () {
    $("#find-container").animate(
      {
        opacity: 0,
      },
      500,
      function () {
        $("#find-container").hide();
      },
    );
  });

  $("#spectator-info-container").hide();

  $("#leave-spectator").on("click", function () {
    $("#ui-layer").show();
    $("#ui-layer").animate(
      {
        opacity: 1,
      },
      250,
    );
    $("#pixi-overlay").animate(
      {
        opacity: 0,
      },
      250,
      function () {
        $("#pixi-overlay").hide();
        $("#sidebar-left").show();
        $("#sidebar-right").show();
        $("#spectator-info-container").hide();
      },
    );
  });
};
