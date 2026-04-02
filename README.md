# Online Airplane Chess

## Goals
 - Implement Airplane Chess
 - Multiplayer functionality?

## TODO
 - [x] Figure out how to zoom and scroll animations
 - [x] Figure out how Pixi.js works 
 - [ ] Use Socket.io for multiplayer functions? -> Need to use separate API
   - [ ] Implement server-side -> need to fix CORS issue
     - [ ] Connect and disconnect
     - [ ] Handle rooms logic   
       - [x] Start game logic
     - [x] Handle waiting room logic
     - [ ] Handle user disconnecting (from game & lobby)
   - [ ] Implement client-side
     - [ ] Handle rooms logic
       - [x] Start game logic
     - [x] Handle waiting in room logic
     - [ ] More TBD
 - [ ] Design and implement in-game UI
   - [x] Figure out how to make the interactive board :(
   - [x] Sidebar design?
   - [ ] Game results UI
 - [ ] In-game functionality (not sure why I wasn't tracking this before lol)
   - [x] Piece Movement
     - [x] Checking for jumps -> same color and flying
     - [x] Capturing pieces for all movements
     - [x] Hangar movement 
     - [x] Piece journey completion
     - [x] Extra turn if you roll a 6
   - [x] Skip turn
   - [x] Add changes to move history  
   - [x] Visually update based on piece data 
 - [ ] In game chat?
 - [x] Figure out theme
   - [x] Minimliast game theme? 
 - [ ] Possible additions:
   - [ ] User account functionality
   - [ ] Dark mode :)
   - [ ] Dice animation
   - [ ] Public game finding?
   - [ ] Piece movement animation
   - [ ] Game creation settings -> variants?
 - [ ] Issues
   - [ ] Disappearing piece issue?? idk man
   - [x] Weird piece count when moving past 52
   - [x] Hangar backwards movement is broken

## Notes

Theme colors:
 - White and light gray
 - Muted colors
   - Red: Soft Terracotta (#EE6C4D)
   - Blue: Dusty Sky (#4e7dba)
   - Green: Sage Leaf (#8FB9A8)
   - Yellow: Muted Mustard (#F4D35E)

In-game UI design:
 - Left sidebar
   - Show list of pieces and their location (grid layout?)
   - Player list?
 - Right sidebar
   - Banner showing whose turn it is
   - Dice roll (with animation? -> sticking to blur to fade in)
     - 3D dice -> possible feature project
   - Move history?
   - Game rules somwhere? (low priority)
   - Turn countdown? (possible later feature)
  
Game results UI design:
 - Horizontal ranked list of players
   - Click on item to show more stats:
     - Captures
     - Jumps
     - Total turns -> least turns wins
     - 6s Rolled
 - Actions: Return to main menu
 - Future: Rewards for win or loss?


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

Room Logic
 - On room create
   - Create room and add host in it
     - Emit room data to host 
     - Host dynamically updates UI 
   - Wait for other users to join
     - Emit updated room data to all users 
     - All users dynamically update their UI based on 
   - If any user leaves (disconnects)
     - Emit to all users
     - All users show message and return to home screen
   - Wait for host start
   - Game ongoing
     - Continuously send updated game states to all users
     - Users update UI and game with these changes
   - Any user disconnects 
     - End game for all users
     - All users show message and return to home screen
   - Game completed
     - Emit to all users
     - Show results and return to home screen

Apparently negative is up and left and positive is down and right (with center being 0,0) for PIXI.js