import { Application, Assets, Sprite, Texture } from "pixi.js";
import { Viewport } from "pixi-viewport";


$("#start").on("click", function () {
  console.log("do something here")
});

$("#join").on("click", function() {
  console.log("do something here")
})
(async () => {
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

  
})();
