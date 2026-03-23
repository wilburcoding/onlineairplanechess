# Online Airplane Chess

## Goals
 - Implement Airplane Chess
 - Multiplayer functionality?

## TODO
 - [x] Figure out how to zoom and scroll animations
 - [ ] Figure out how Pixi.js works 
 - [ ] Use Socket.io for multiplayer functions? -> Need to use separate API
   - [ ] Implement server-side -> need to fix CORS issue
     - [ ] Connect and disconnect
     - [ ] Handle rooms logic
     - [ ] Handle waiting room logic
     - [ ] Handle user disconnecting (from game & lobby)
   - [ ] Implement client-side
     - [ ] Handle rooms logic
     - [ ] Handle waiting in room logic
     - [ ] More TBD
 - [ ] Design and implement in-game UI
 - [ ] In game chat?
 - [x] Figure out theme
   - [x] Minimliast game theme? 

## Notes

Theme colors:
 - White and light gray
 - Muted colors
   - Red: Soft Terracotta (#EE6C4D)
   - Blue: Dusty Sky (#4e7dba)
   - Green: Sage Leaf (#8FB9A8)
   - Yellow: Muted Mustard (#F4D35E)

Game FLow
 - Presses start button
   - Shows game screen
   - Waits for players and show room code
   - Show start game button if there is 2-4 people in the game
   - Play game
     - End game if any users disconnect
   - View game if you won already
   - Show results and option to return to home screen
 - Presses join game
   - Show game screen
   - Show number of players 
   - Waits for the creator of the host game to start game
   - Play game
   - Viewer mode when you won already
   - Ends game if users disconnect
   - Show results and option to return to home screen
 - For both of these, if the host leaves the waiting room for a game
   - Show message and return to home screen

