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
            default:
                console.error("ERROR: Unrecognized message type");
                break;
        }
    });

    // Handle disconnect
    ws.on('close', (code, reason) => {
        console.log(`Connection closed: ${reason}`);
    })
});


// Create a game for player ws and add it to the gamesTable
// Returns the resulting randomly generated id and whether the game was created
function createGame(ws) {
    // Don't create a game if the player is already in one
    if (playersSet.has(ws)) {
        return {type: 'creategame', id: null, success: false};
    }

    console.log("Creating game");
    let gameid = crypto.randomBytes(3).toString('hex');
    gamesTable[gameid] = {
        game: new Game(),
        players: [ws]
    };
    playersSet.add(ws);
    return {type: 'creategame', id: gameid, success: true};
};
