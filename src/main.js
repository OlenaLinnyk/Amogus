window.onload = function ()
{
  // Store the canvas and define its size. This is the bottom layer containing the game world.
  var canvas1 = document.getElementById("playArea");
  canvas1.width = 640;
  canvas1.height = 640;
  //Get the canvas context, and assign to a variable.
  var context1 = canvas1.getContext("2d");
  // Get a refernece to the HTML paragraph element. The user status will be printed here.
  var gameInfo = document.getElementById("gameInfo");

  var hatchSound = document.getElementById('hatchSound');
  var doorSound = document.getElementById('doorSound');
  var amogusIsNearbySound = document.getElementById('amogusIsNearbySound');

  // An enumeration of all of the different possible terrain types.
  var terrainTypes =
  {
    GHOST: 0,
    AMOGUS: 1,
    HELMET: 2,
    ENTER: 3,
    NOTHING: 4,
    HATCH: 5,
    DARKNESS: 6,
    EXIT: 7,
    CORPSE: 8,
    HATCHCOVERPARTS: 9,
    CORPSEANDHATCHCOVERPARTS: 10
  };

  // An enumeration of all of the different possible game states.
  var gameStatus =
  {
    START: 0,
    PLAYING: 1,
    VICTORY: 2,
    GAMEOVER: 3,
    currentStatus: 0
  };

  // With properties describing win, loss, and gold ownership.
  var playerStats =
  {
    hasTreasure: false,
    totalWins: 0,
    totalLosses: 0
  };

  // Create all of the terain objects. The tilemap will consist of references to these objects.
  var ghost = new Terrain("Ghosts.png", terrainTypes.GHOST, "You crashed into a group of ghosts. You got scared and got lost running away.", "You see a corpse. There are ghosts nearby.");
  var amogus = new Terrain("Amogus.png", terrainTypes.AMOGUS, "The Amogus killed you.", "You are hearing a strange music. The Amogus is nearby.");
  var helmet = new Terrain("Helmet.png", terrainTypes.HELMET, "You found your helmet. Now you can escape from this horror spaceship", "");
  var enter = new Terrain("Spawn.png", terrainTypes.ENTER, "This is your spawn.", "");
  var nothing = new Terrain("Path.png", terrainTypes.NOTHING, "Nothing strange.", "");
  var hatch = new Terrain("Hatch.png", terrainTypes.HATCH, "You fell into a hatch and broke your neck.", "There's a hatch cover. A hatch is nearby.");
  var darkness = new Terrain("Darkness.png", terrainTypes.DARKNESS, "", "");
  var exit = new Terrain("Door.png", terrainTypes.EXIT, "This is the exit! You need your helmet to escape", "");
  var corpse = new Terrain("Corpse.png", terrainTypes.CORPSE, "", "");
  var hatchCoverParts = new Terrain("HatchCoverParts.png", terrainTypes.HATCHCOVERPARTS, "", "");
  var corpseAndHatchCoverParts = new Terrain("CorpseAndCover.png", terrainTypes.CORPSEANDHATCHCOVERPARTS, "", "");

  // Global variables to store player position.
  var entranceX;
  var entranceY;
  var currentCell;

  // Define the constructs for the tilemap. A 10 x 10 grid, with blocks measuring 64 x 64 pixels.
  var tileMap = new TileMap(10, 10, 64, 64);

  // Creates the object that delegates the generation of textual status updates.
  var statusTextGenerator = new StatusTextGenerator();

  // Constructor for a terrain object.
  //
  // Params:
  // terainColor - Hex value for the color of the terrain.
  // myTerrain - The terrain type. Can be expressed with the terrainTypes enumeration.
  // activeMessage - The message used when the player is standing on the terrain.
  // nearbyMessage - The message used when the player is surrounded by the terrain.
  function Terrain(terrainImage, myTerrain, activeMessage, nearbyMessage)
  {
    this.terrainImage = new Image();
    this.terrainImage.src = terrainImage;
    this.myTerrain = myTerrain;
    this.activeMessage = activeMessage;
    this.nearbyMessage = nearbyMessage;
  };

  // Constructor for a tile map object, of which there is only one.
  //
  // Params:
  // mapHeight - The height of the map in tiles.
  // mapWidth - The width of the map in tiles.
  // tileWidth - The width of a single tile in pixels.
  // tileHeight - The height of a single tile in pixels.
  function TileMap(mapHeight, mapWidth, tileWidth, tileHeight)
  {
    this.map = new Array(100);
    this.mapHeight = mapHeight;
    this.mapWidth = mapWidth;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;

    // Keeps track of the indexes in the array that have been visited by the player.
    this.exploredPath = [];

    // Randomly generates a tile map, and store the entrance infomration into global variables.
    this.createRandomMap = function()
    {
        // First, fill the whole map with safe pathways (nothing).
        for (var i = 0; i < this.map.length; i++)
        {
            this.map[i] = nothing;
        }

        var randomIndex;
        var indexesWithObjects = new Array();
        function getRandomIndex()
        {
          do
          {
            randomIndex = Math.floor(Math.random() * 100);
          }
          while (indexesWithObjects.indexOf(randomIndex) !== -1);
          indexesWithObjects.push(randomIndex);
          return randomIndex;
        };

        // Add all of our unique game elements to the map. No overlap is possible with the above function.
        var h1 = getRandomIndex();
        var h2 = getRandomIndex();
        this.map[h1] = hatch;
        this.map[h2] = hatch;
        indexesWithObjects.push(h1+1, h1+9, h1+10, h1+11, h1-1, h1-9, h1-10, h1-11, h2+1, h2+9, h2+10, h2+11, h2-1, h2-9, h2-10, h2-11);
        var g1 = getRandomIndex();
        var g2 = getRandomIndex();
        this.map[g1] = ghost;
        this.map[g2] = ghost;

        for (var i = 0; i < this.map.length; i++){
          var nr = 0;
          var nl = 0;
          var nu = 0;
          var nd = 0;
          var nru = 0;
          var nrd = 0;
          var nlu = 0;
          var nld = 0;
          if (i % 10 == 9){
            nr = -1;
            nru = -1;
            nrd = -1
          }
          if (i % 10 == 0){
            nl = -1;
            nlu = -1;
            nld = -1;
          }
          if (Math.floor(i / 10) == 0){
            nu = -1;
            nru = -1;
            nlu = -1;
          }
          if (Math.floor(i / 10) == 9){
            nd = -1;
            nrd = -1;
            nld = -1;
          }
          var hatchIndex = 0;
          var ghostIndex = 0;
          if (nr !== -1){
            if (this.map[i+1] == hatch){
              hatchIndex++;
            }
            if (this.map[i+1] == ghost){
              ghostIndex++;
            }
          }
          if (nl !== -1){
            if (this.map[i-1] == hatch){
              hatchIndex++;
            }
            if (this.map[i-1] == ghost){
              ghostIndex++;
            }
          }
          if (nu !== -1){
            if (this.map[i-10] == hatch){
              hatchIndex++;
            }
            if (this.map[i-10] == ghost){
              ghostIndex++;
            }
          }
          if (nd !== -1){
            if (this.map[i+10] == hatch){
              hatchIndex++;
            }
            if (this.map[i+10] == ghost){
              ghostIndex++;
            }
          }
          if (nru !== -1){
            if (this.map[i-9] == hatch){
              hatchIndex++;
            }
            if (this.map[i-9] == ghost){
              ghostIndex++;
            }
          }
          if (nlu !== -1){
            if (this.map[i-11] == hatch){
              hatchIndex++;
            }
            if (this.map[i-11] == ghost){
              ghostIndex++;
            }
          }
          if (nrd !== -1){
            if (this.map[i+11] == hatch){
              hatchIndex++;
            }
            if (this.map[i+11] == ghost){
              ghostIndex++;
            }
          }
          if (nld !== -1){
            if (this.map[i+9] == hatch){
              hatchIndex++;
            }
            if (this.map[i+9] == ghost){
              ghostIndex++;
            }
          }
          if (this.map[i] !== hatch){
            if (hatchIndex > 0){
              if (ghostIndex > 0){
                this.map[i] = corpseAndHatchCoverParts;
                indexesWithObjects.push(i);
              }
              else{
                this.map[i] = hatchCoverParts;
                indexesWithObjects.push(i);
              }
            }
            else{
              if (ghostIndex > 0){
                this.map[i] = corpse;
                indexesWithObjects.push(i);
              }
            }
          }
        }
        this.map[getRandomIndex()] = enter;
        this.map[getRandomIndex()] = exit;
        this.map[getRandomIndex()] = amogus;
        this.map[getRandomIndex()] = helmet;

        // Figure out where the entrance is, and figure out where the stick figure needs to begin (in terms of pixels).
        // Determine the currentIndex for later use.
        var enterIndex = this.map.indexOf(enter);
        entranceY = Math.floor(enterIndex / 10) * 64;
        currentIndex = enterIndex;
        if (enterIndex % 10 > 0)
        {
          entranceX = (enterIndex % 10) * 64;
        }
        else {
          entranceX = 0;
        }
        // Add the entrance to the visible path.
        this.exploredPath.push(currentIndex);
    };

    // Renders all of the tiles present in this.map, making sure to mask unvisited areas with darkness.
    this.renderEntity = function()
    {
        for(var y = 0; y < mapHeight; y++)
        {
          for(var x = 0; x < mapWidth; x++)
          {
            // Render tile at (x,y)
            var currentTerrain = this.map[y * mapWidth + x];
            var xDrawPoint = x * tileWidth;
            var yDrawPoint = y * tileHeight;

            // Draw a rectangle based on the color of the given terrain type.
            // If the tile has not been visited yet, then it should be drawn as darkness.
            // if (this.exploredPath.indexOf(y * 10 + x) == -1)
            // {
            //   context1.fillStyle = darkness.terrainImage;
            // }
            // else
            // {
            //   context1.fillStyle = currentTerrain.terrainImage;
            // }
            // context1.fillRect(xDrawPoint, yDrawPoint, tileWidth, tileHeight);

            if (this.exploredPath.indexOf(y * 10 + x) == -1) {
              context1.drawImage(darkness.terrainImage, xDrawPoint, yDrawPoint, tileWidth, tileHeight);
            } else {
              context1.drawImage(currentTerrain.terrainImage, xDrawPoint, yDrawPoint, tileWidth, tileHeight);
            }
          
          }
        }
    };

    // For use at the end of a game. Removes all darkness from the map.
    this.lightUpRoom = function()
    {
      for (var i = 0; i < 100; i++)
      {
        this.exploredPath[i] = i;
      }
    }

  };

  // Constructor for the little stickFigure sprite that moves around the map.
  // The figues movements are in control of an event listener created herein.
  function stickFigurePlayer()
  {
    this.stickFigure = new Image();
    this.x = entranceX;
    this.y = entranceY;
    this.stickFigure.src = "PlayerWithoutHelmet64.png";
    this.stickFigure.width = 64;
    this.stickFigure.height = 64;

    // The figure is rendered in the center of each block, begining with the entrance.
    this.renderEntity = function()
    {
      context1.drawImage(this.stickFigure, this.x + 12, this.y);
    };

    // Move the player correctly via arrow keys, and advance the game with the enter key. Manages the game state.
    window.addEventListener('keydown', function(event) {
        // If the game is in the start state and the player presses an arrow key, advance the game to the PLAYING state.
        if (gameStatus.currentStatus == gameStatus.START && (event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40))
        {
          event.preventDefault();
          gameStatus.currentStatus = gameStatus.PLAYING;
        }
        // If the game is being played, evaluate all possible movement and update events.
        if (gameStatus.currentStatus == gameStatus.PLAYING)
        {
          if (event.keyCode === 37 && (stickFigure.x - tileMap.tileWidth) >= 0) // Left arrow
          {
            event.preventDefault();
            stickFigure.x -= tileMap.tileWidth;
            currentIndex--;
          }
          else if (event.keyCode === 38 && (stickFigure.y - tileMap.tileHeight) >= 0) // Up arrow
          {
            event.preventDefault();
            stickFigure.y -= tileMap.tileHeight;
            currentIndex -= tileMap.mapWidth;
          }
          else if (event.keyCode === 39 && (stickFigure.x + tileMap.tileWidth) < (tileMap.mapWidth * tileMap.tileWidth)) // Right arrow
          {
            event.preventDefault();
            stickFigure.x += tileMap.tileWidth;
            currentIndex++;
          }
          else if (event.keyCode === 40 && (stickFigure.y + tileMap.tileHeight) < (tileMap.mapHeight * tileMap.tileHeight)) // Down arrow
          {
            event.preventDefault();
            stickFigure.y += tileMap.tileHeight;
            currentIndex += tileMap.mapWidth;
          }

          statusTextGenerator.generateMainMessage();

          // If the player steps on a bat, then the player must be transported to the different area of the map.
          if (tileMap.map[currentIndex] == ghost) // Deal with landing on a bat.
          {
            var randomIndexForHuman;
            tileMap.exploredPath = []; // Clears the current path.

            // Put the player in a random empty space.
            do
            {
              randomIndexForHuman = Math.floor(Math.random() * 100);
            }
            while (tileMap.map[randomIndexForHuman] !== nothing);
            stickFigure.y = Math.floor(randomIndexForHuman / 10) * 64;
            currentIndex = randomIndexForHuman;
            if (randomIndexForHuman % 10 > 0)
            {
              stickFigure.x = (randomIndexForHuman % 10) * 64;
            }
            else
            {
              stickFigure.x = 0;
            }
          }
          else if (tileMap.map[currentIndex] == helmet) // Deal with landing on the treasure.
          {
            playerStats.hasTreasure = true;
            stickFigure.src = "PlayerWithHelmet64.png";
            helmet.src = "Helmet.jpg";
          }

          tileMap.exploredPath.push(currentIndex);
          statusTextGenerator.generateContextMessage();

          // WIN AND LOSS STATES
          // If the player gets to the exit with the treasure, then they win!
          if (tileMap.map[currentIndex] == exit && playerStats.hasTreasure == true){
            tileMap.lightUpRoom();
            playerStats.totalWins++;
            render();
            gameInfo.innerHTML = "<b>You escaped! Congratulations!<br /><br /><i>Press the enter play again.</i><br /></b>";
            gameStatus.currentStatus = gameStatus.VICTORY;
          }
          // If the player lands on the Wumpus or a pit then the game ends! No need to generate the messages of surrounding objects
          // on game over. Thus, the generateContextMessage() method occurs before this if statement.
          else 
            if (tileMap.map[currentIndex] == amogus || tileMap.map[currentIndex] == hatch){
              // Render the canvas with the player in the pit or wumpus. The game loop stops here, and therefore this ensures that this frame is properly rendered.
              tileMap.lightUpRoom();
              if (tileMap.map[currentIndex] == hatch){
                hatchSound.play();
              }
              else{
                amogusIsNearbySound.play();
              }
              playerStats.totalLosses++;
              render();
              gameStatus.currentStatus = gameStatus.GAMEOVER;
              statusTextGenerator.updateEntity();
              gameInfo.innerHTML += "<br /><b><i>Press the enter play again.</b></i>"
            }
            else
              if (tileMap.map[currentIndex] == exit){
                doorSound.play();
              }
            if (currentIndex % 10 != 0)
            {
              if (tileMap.map[currentIndex-1] == amogus){
                 amogusIsNearbySound.play();
              }
            }
            if (currentIndex % 10 != 9)
            {
              if (tileMap.map[currentIndex+1] == amogus){
                amogusIsNearbySound.play();
              }
            }
            if (currentIndex > 9)
            {
              if (tileMap.map[currentIndex-1] == amogus){
                amogusIsNearbySound.play();
              }
            }
            if (currentIndex < 90)
            {
              if (tileMap.map[currentIndex+10] == amogus){
                amogusIsNearbySound.play();
              }
            }
            if (currentIndex < 89 && currentIndex % 10 != 9)
            {
              if (tileMap.map[currentIndex+11] == amogus){
                amogusIsNearbySound.play();
              }
            }
            if (currentIndex > 10 && currentIndex % 10 != 0)
            {
              if (tileMap.map[currentIndex-11] == amogus){
                amogusIsNearbySound.play();
              }
            }
            if (currentIndex < 90 && currentIndex % 10 != 0)
            {
              if (tileMap.map[currentIndex+9] == amogus){
                amogusIsNearbySound.play();
              }
            }
            if (currentIndex > 9 && currentIndex % 10 != 9)
            {
              if (tileMap.map[currentIndex-9] == amogus){
                amogusIsNearbySound.play();
              }
            }
        }
      // If the player has won or lost, then give them the ability to restart the game by pressing enter.
      if (event.keyCode === 13 && (gameStatus.currentStatus == gameStatus.GAMEOVER || gameStatus.currentStatus == gameStatus.VICTORY))
      {
        gameStatus.currentStatus = gameStatus.START;
        playerStats.hasTreasure = false;
        tileMap.exploredPath = [];
        tileMap.createRandomMap();
        statusTextGenerator.updateEntity();
        stickFigure.x = entranceX;
        stickFigure.y = entranceY;
        gameLoop();
      }
    });
  }

  // This constructor creates the singular StatusTextGenerator.
  // It displays the correct game information in a paragraph based on the game state.
  function StatusTextGenerator()
  {

    this.updateEntity = function()
    {
      this.generateMainMessage();

      if (gameStatus.currentStatus != gameStatus.GAMEOVER)
      {
        this.generateContextMessage();
      }
    }

    // A message based on the tile currently being stood on.
    this.generateMainMessage = function()
    {
      var treasureString = "No.";
      if (playerStats.hasTreasure)
      {
        treasureString = "Yes!"
      }
      var spacingString = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;"

      // Maintains current status for the game in the paragraph element.
      gameInfo.innerHTML = "<b 'color:black; font-family: Nunito; font-size: 6vh;'>TOTAL WINS: " + playerStats.totalWins + spacingString + "TOTAL LOSES: " + playerStats.totalLosses + spacingString + "Treasure Claimed?: " + treasureString + "<br />";

      // Displays the main user messged based on the game state.
      switch (gameStatus.currentStatus)
      {
        case gameStatus.START:
          gameInfo.innerHTML += "<b 'color:black; font-family: Nunito; font-size: 6vh;>Your spaceship was atacked by a crazy Amogus<br /><br />Find your helmet, and escape from the spaceship. Move with arrows<br /></b>";
          break;
        case gameStatus.PLAYING:
          gameInfo.innerHTML += "<b>" + tileMap.map[currentIndex].activeMessage + "</b><br />";
          break;
        case gameStatus.GAMEOVER:
          gameInfo.innerHTML += "<b>" + tileMap.map[currentIndex].activeMessage + "</b><br />";
          break;
        default:
          return;
      }
    };

    // Generates the messages derived from tiles surrounding the player. Searches through the 8 tiles surrounding the player.
    this.generateContextMessage = function()
    {
      if (currentIndex % 10 != 0)
      {
        if (tileMap.map[currentIndex-1] == amogus || tileMap.map[currentIndex-1] == hatch || tileMap.map[currentIndex-1] == ghost)
        {
          if (tileMap.map[currentIndex-1] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex-1].nearbyMessage + "<br />";
        }
      }
      if (currentIndex % 10 != 9)
      {
        if (tileMap.map[currentIndex+1] == amogus || tileMap.map[currentIndex+1] == hatch || tileMap.map[currentIndex+1] == ghost)
        {
          if (tileMap.map[currentIndex+1] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex+1].nearbyMessage + "<br />";
        }
      }
      if (currentIndex > 9)
      {
        if (tileMap.map[currentIndex-10] == amogus || tileMap.map[currentIndex-10] == hatch || tileMap.map[currentIndex-10] == ghost)
        {
          if (tileMap.map[currentIndex-1] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex-10].nearbyMessage + "<br />";
        }
      }
      if (currentIndex < 90)
      {
        if (tileMap.map[currentIndex+10] == amogus || tileMap.map[currentIndex+10] == hatch || tileMap.map[currentIndex+10] == ghost)
        {
          if (tileMap.map[currentIndex+10] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex+10].nearbyMessage + "<br />";
        }
      }
      if (currentIndex < 89 && currentIndex % 10 != 9)
      {
        if (tileMap.map[currentIndex+11] == amogus || tileMap.map[currentIndex+11] == hatch || tileMap.map[currentIndex+11] == ghost)
        {
          if (tileMap.map[currentIndex+11] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex+11].nearbyMessage + "<br />";
        }
      }
      if (currentIndex > 10 && currentIndex % 10 != 0)
      {
        if (tileMap.map[currentIndex-11] == amogus || tileMap.map[currentIndex-11] == hatch || tileMap.map[currentIndex-11] == ghost)
        {
          if (tileMap.map[currentIndex-11] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex-11].nearbyMessage + "<br />";
        }
      }
      if (currentIndex < 90 && currentIndex % 10 != 0)
      {
        if (tileMap.map[currentIndex+9] == amogus || tileMap.map[currentIndex+9] == hatch || tileMap.map[currentIndex+9] == ghost)
        {
          if (tileMap.map[currentIndex+9] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex+9].nearbyMessage + "<br />";
        }
      }
      if (currentIndex > 9 && currentIndex % 10 != 9)
      {
        if (tileMap.map[currentIndex-9] == amogus || tileMap.map[currentIndex-9] == hatch || tileMap.map[currentIndex-9] == ghost)
        {
          if (tileMap.map[currentIndex-9] == amogus){
            amogusIsNearbySound.play();
          }
          gameInfo.innerHTML += "- " + tileMap.map[currentIndex-9].nearbyMessage + "<br />";
        }
      }
    }
  }

  // Consolidates the render functions. Continously renders the tileMap, the stickFigure(player).
  function render()
  {
    context1.clearRect(0,0,640,640);
    tileMap.renderEntity();
    stickFigure.renderEntity();
  }

  // The game loop continues until the player wins or loses.
  function gameLoop()
  {
    if (gameStatus.currentStatus != gameStatus.GAMEOVER && gameStatus.currentStatus != gameStatus.VICTORY)
    {
      render();
      window.requestAnimationFrame(gameLoop);
    }
  }

  // Create the map, the player, and the status text. Then begin gameplay (also triggers rendering).
  tileMap.createRandomMap();
  var stickFigure = new stickFigurePlayer();
  statusTextGenerator.updateEntity();
  gameLoop();
};
