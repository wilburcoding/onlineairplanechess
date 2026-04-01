import {
  Application,
  Assets,
  Sprite,
  Texture,
  Polygon,
  Graphics,
  Text,
  TextStyle,
} from "pixi.js";
import { Viewport } from "pixi-viewport";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
});

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
  const style = new TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fill: "0x000000",
    wordWrap: true,
    wordWrapWidth: 400,
  });
  for (let key of Object.keys(COORDS)) {
    const text = new Text({ text: key, style: style });
    text.x = COORDS[key][0] - 35;
    text.y = COORDS[key][1] - 25;
    viewport.addChild(text);
  }

  app.stage.addChild(viewport);
  viewport.drag().pinch().wheel().decelerate();

  viewport.moveCenter(0, 0);
}
let dice_roll = null;

window.onload = function () {
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
  $("#pixi-overlay").hide();

  init().catch((err) => {
    console.error("Error initializing PIXI.js graphics:", err);
  });

  $("#start").prop("disabled", true);
  $("#join").prop("disabled", true);

  $("#username").on("input", function () {
    if ($(this).val().length == 0) {
      $("#start").prop("disabled", true);
      $("#join").prop("disabled", true);
    } else {
      $("#start").prop("disabled", false);
      $("#join").prop("disabled", false);
    }
  });

  // Handling waiting room functionality

  $("#host-actions-container").hide();
  $("#non-host-actions-container").hide();

  // start button -> home screen
  $("#start").on("click", function () {
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
            console.log("Successfully joined room");
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
    $("#waiting-room").hide();
    $("#sidebar-left").show();
    $("#sidebar-right").show();
    viewport.animate({
      scaleX: 0.25,
      scaleY: 0.25,
      time: 1000,
    });
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
        sprite.on("click", () => {
          console.log(game_data);
          console.log(game_data.turn)
          if (game_data.players[game_data.turn].id == socket.id && $("#roll-dice").prop("disabled") == true && game_data.players[i].id == socket.id) {
            // make sure its the right players turn and they have rolled the dice and they are clicking on their own piece
            if (game_data.players[i].pieces[j].status == "home") { // need a six to get out
              if (dice_roll == 6) {
                socket.emit("move-piece", { piece: j, player: i, roll: dice_roll});
              }
            } else {
              socket.emit("move-piece", {piece: j, player: i, roll:dice_roll})
            }
          }
        })
      }
      player_sprites.push(player);
    }
  });

  // next move game listener
  socket.on("game-update", (room_data) => {
    game_data = room_data;
    // check if move is for current player
    $("#turn-status-container").css(
      "background-color",
      COLOR_HEX[game_data.turn],  
    );
    if (game_data.players[game_data.turn].id == socket.id) {
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
    //update move history log UI
    if ($("#move-history").children().length < game_data.history.length) {
      console.log(game_data.history);
      for (
        let i = $("#move-history").children().length ;
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
        $("#move-history").append(
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
    for (let i = 0; i < game_data.players.length ; i++) {
      for (let j = 0; j < game_data.players[i].pieces.length; j++) {
        const piece = game_data.players[i].pieces[j];
        const sprite = player_sprites[i][j];
        sprite.position.set(COORDS[piece.location][0] - 45, COORDS[piece.location][1] - 45);
      }
    }
  });

  //handle dice roll
  $("#roll-dice").on("click", function () {
    dice_roll = Math.floor(Math.random() * 6) + 1;
    // dice_roll = 6; // debugging purposes
    $("#dice-result").css("opacity", 0);
    $("#dice-result").text(dice_roll);
    $("#dice-result").animate({ opacity: 1 }, 250);
    $(this).prop("disabled", true); 

    // check for no possible moves and skip turn if necessary
    let possible_move = false;
    for (let i = 0; i < game_data.players[game_data.turn].pieces.length; i++) {
      if (game_data.players[game_data.turn].pieces[i].status != "home") {
        possible_move = true;
      } 
    }

    if (possible_move == false && dice_roll != 6) {
      socket.emit("skip-turn");
    } 
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
    }
  }
};
