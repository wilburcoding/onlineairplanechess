import {
  Application,
  Assets,
  Sprite,
  Texture,
  Polygon,
  Graphics,
} from "pixi.js";
import { Viewport } from "pixi-viewport";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
});

function create_rect1(rect, i, coord) {
  // vertical rectangle
  if (i == 0) {
    rect.rect(coord[0], coord[1], 200, 300);
  } else if (i == 1) {
    rect.rect(coord[0] - 300, coord[1], 300, 200);
  } else if (i == 2) {
    rect.rect(coord[0] - 200, coord[1] - 300, 200, 300);
  } else {
    rect.rect(coord[0], coord[1] - 200, 300, 200);
  }
}

function create_rect2(rect, i, coord) {
  // horizontal rectangle
  if (i == 0) {
    rect.rect(coord[0], coord[1], 300, 200);
  } else if (i == 1) {
    rect.rect(coord[0] - 200, coord[1], 200, 300);
  } else if (i == 2) {
    rect.rect(coord[0] - 300, coord[1] - 200, 300, 200);
  } else {
    rect.rect(coord[0], coord[1] - 300, 200, 300);
  }
}

function create_tri(tri, i, coord) {
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
  }
}
async function init() {
  const COLORS = ["green", "red", "yellow", "blue"];
  const COLOR_HEX = [0xfb9a8, 0xee6c4d, 0xf4d35e, 0x4e7dba];
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#dce4f5", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // create viewport
  const viewport = new Viewport({
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
  for (let i = 0; i < 4; i++) {
    const triangle = new Graphics();
    console.log(COLOR_HEX[i]);
    console.log(CENTER_TRI_POINTS[i], CENTER_TRI_POINTS[i + 1]);
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
    for (let j = 0; j < 7; j++) {
      const circle = new Graphics();
      circle
        .circle(orig_coord[0], orig_coord[1], 50)
        .fill({ color: 0xffffff })
        .stroke({ color: 0x000000, width: 4 });
      viewport.addChild(circle);
      orig_coord[1] -= 200;
    }
  }
  // const newrect = new Graphics(); //debugging to make sure i got my sizing right
  // newrect.rect(-300, -1500, 200, 300).fill({ color: 0xff0000 });
  // viewport.addChild(newrect);

  // total space is 1400 = 200 * 4 (horizontal) + 300 * 2 (vertical)
  // tile dimenstions are 200 x 300 and circles have radius 50

  // the rest of the game board
  for (let i = 0; i < 4; i++) {
    //start with yellow because its easiest lol
    let coord = [100, -1500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const r1 = new Graphics();
    create_rect1(r1, i, coord);
    r1.fill({ color: COLOR_HEX[(i + 3) % 4] });
    viewport.addChild(r1);

    coord = [300, -1500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const r2 = new Graphics();
    create_rect1(r2, i, coord);
    r2.fill({ color: COLOR_HEX[(i + 4) % 4] });
    viewport.addChild(r2);

    //first triangle corner
    coord = [500, -1500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const t1 = new Graphics();
    create_tri(t1, i, coord);
    t1.fill({ color: COLOR_HEX[(i + 5) % 4] });
    viewport.addChild(t1);

    // first horizontal rectangle column
    coord = [500, -1200];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const r3 = new Graphics();
    create_rect2(r3, i, coord);
    r3.fill({ color: COLOR_HEX[(i + 6) % 4] });
    viewport.addChild(r3);

    coord = [500, -1000];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }

    const r4 = new Graphics();
    create_rect2(r4, i, coord);
    r4.fill({ color: COLOR_HEX[(i + 7) % 4] });
    viewport.addChild(r4);

    // second triangle corner -> its a double
    coord = [800, -800];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }

    const t2 = new Graphics();
    create_tri(t2, (i + 1) % 4, coord);
    t2.fill({ color: COLOR_HEX[(i + 8) % 4] });
    viewport.addChild(t2);

    coord = [500, -500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    create_tri(t2, (i + 3) % 4, coord);
    t2.fill({ color: COLOR_HEX[(i + 9) % 4] });
    viewport.addChild(t2);

    // second vertical rectangle row
    coord = [800, -800];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const r5 = new Graphics();
    create_rect1(r5, i, coord);
    r5.fill({ color: COLOR_HEX[(i + 10) % 4] });
    viewport.addChild(r5);

    coord = [1000, -800];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const r6 = new Graphics();
    create_rect1(r6, i, coord);
    r6.fill({ color: COLOR_HEX[(i + 11) % 4] });
    viewport.addChild(r6);

    // final triangle corner
    coord = [1200, -800];
    for (let j =0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const t3 = new Graphics();
    create_tri(t3, i, coord);
    t3.fill({ color: COLOR_HEX[(i + 12) % 4]});
    viewport.addChild(t3);

    // final horizontal rectangle column
    coord = [1200, -500];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }

    const r7 = new Graphics();
    create_rect2(r7, i, coord);
    r7.fill({ color: COLOR_HEX[(i + 13) % 4] });
    viewport.addChild(r7);

    coord = [1200, -300];
    for (let j = 0; j < i; j++) {
      coord = [-coord[1], coord[0]];
    }
    const r8 = new Graphics();
    create_rect2(r8, i, coord);
    r8.fill({ color: COLOR_HEX[(i + 14) % 4]});
    viewport.addChild(r8);
  }

  app.stage.addChild(viewport);
  viewport.drag().pinch().wheel().decelerate();

  viewport.moveCenter(0, 0);
}

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

  // game start listener
  socket.on("game-start", (room_data) => {
    $("#waiting-room").hide();
    $("#sidebar-left").show();
    $("#sidebar-right").show();
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
          <p id="p${i}-name">Player ${i}</p>
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
