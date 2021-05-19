const {Server} = require('ws');
const crypto = require('crypto');
const wss = new Server({port: 8000});
const Game = require('./game.js');

var gamesTable = {};        // Holds the ongoing games in [id: {game, players}] pairs
var playersSet = new Set(); // Set of WebSockets already in a game

console.log("Listening on port 8000...");
wss.on('connection', (ws, req) => {
    console.log(`Connection created: ${req.connection.remoteAddress}`);

    // Send a message on initial connection
    let initial = {type: 'connection', players: wss.clients.size};
    ws.send(JSON.stringify(initial));

    // Handle messages from client
    ws.on('message', (data) => {
        let msg = JSON.parse(data);
        
        switch(msg.type) {
            case "creategame":
                ws.send(JSON.stringify(createGame(ws)));
                break;
            case "joingame":
                ws.send(JSON.stringify(joinGame(ws, msg.gameid)));
                break;
            default:
                console.error("ERROR: Unrecognized message type");
                break;
        }
    });

    // Handle disconnect
    ws.on('close', (code) => {
        console.log(`Connection closed: ${req.connection.remoteAddress}`);
    })
});


// Create a game for player ws and add it to the gamesTable
// Returns the resulting randomly generated id and whether the game was created
function createGame(ws) {
    // Don't create a game if the player is already in one
    if (playersSet.has(ws))
        return {type: 'creategame', id: null, numPlayers: null, success: false};

    console.log("Creating game");
    let gameid = crypto.randomBytes(3).toString('hex');
    gamesTable[gameid] = {
        game: new Game(),
        players: [ws]
    };
    playersSet.add(ws);
    
    // Update the members of the game with the player count
    updateNumPlayers(gameid)
    return {type: 'creategame', id: gameid, success: true};
};


// Join a game for player ws using gameid, add them to gamesTable
function joinGame(ws, gameid) {
    // Don't join a game if the player is already in one
    // or if the room code is invalid
    if (playersSet.has(ws) || !gamesTable.hasOwnProperty(gameid))
        return {type: 'joingame', id: null, success: false};

    console.log("Joining game");
    gamesTable[gameid].players.push(ws);
    playersSet.add(ws);

    // Update the members of the game with the player count
    updateNumPlayers(gameid)
    return {type: 'joingame', id: gameid, success: true};
}

// Update the number of players for every client in a game with gameid
function updateNumPlayers(gameid) {
    let numPlayers = gamesTable[gameid].players.length;
    gamesTable[gameid].players.forEach((ws) => {
        ws.send(JSON.stringify({type: 'numplayers', num: numPlayers}));
    });
}
