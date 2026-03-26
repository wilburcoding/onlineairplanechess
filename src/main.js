import { Application, Assets, Sprite, Texture } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
});

async function init() {
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

  // add the viewport to the stage
  app.stage.addChild(viewport);

  // activate plugins
  viewport.drag().pinch().wheel().decelerate();

  // Replace with your Express server URL
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

  init();
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
  $("#start-game").on("click", function() {
    socket.emit("start-game");
  })

  // game start listener
  socket.on("game-start", (room_data) => {
    $("#waiting-room").hide();
    $("#sidebar-left").show();
    $("#sidebar-right").show();

  })
};
