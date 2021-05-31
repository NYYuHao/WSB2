const {Server} = require('ws');
const crypto = require('crypto');
const wss = new Server({port: 8000});
const Game = require('./game.js');

var gamesTable = {};    // Holds the ongoing games in [id: {game, players}] pairs
var pidTable = {}       // Holds {playerid: ws} pairs for all players in a game
var connectionsSet = new Set(); // Set of connected pids (not just those in a game)

console.log("Listening on port 8000...");
wss.on('connection', (ws, req) => {
    console.log(`Connection created: ${req.connection.remoteAddress}`);

    // Send a message on initial connection
    let initial = {type: 'notification', text: `Players: ${wss.clients.size}`};
    ws.send(JSON.stringify(initial));

    // Create a unique player id for the ws
    let pid;
    do {
        pid = crypto.randomBytes(3).toString('hex');
    } while (connectionsSet.has(pid));
    connectionsSet.add(pid);
    ws.pid = pid

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
    if (pidTable.hasOwnProperty(ws.pid))
        return {type: 'creategame', id: null, success: false};

    console.log("Creating game");

    // Repeatedly generate an ID until one is unique
    let gameid;
    do {
        gameid = crypto.randomBytes(3).toString('hex');
    } while (gamesTable.hasOwnProperty(gameid));

    gamesTable[gameid] = new Game();
    gamesTable[gameid].addPlayer(ws.pid);
    pidTable[ws.pid] = ws;
    
    // Update the members of the game with the player count
    updateNumPlayers(gameid)
    return {type: 'creategame', id: gameid, success: true};
};


// Join a game for player ws using gameid, add them to gamesTable
function joinGame(ws, gameid) {
    // Don't join a game if the player is already in one
    // or if the room code is invalid
    if (pidTable.hasOwnProperty(ws.pid) || !gamesTable.hasOwnProperty(gameid))
        return {type: 'joingame', id: null, success: false};

    console.log("Joining game");

    // TODO: Ensure that adding a player is possible via try catch
    gamesTable[gameid].addPlayer(ws.pid);
    pidTable[ws.pid] = ws;

    // Update the members of the game with the player count
    updateNumPlayers(gameid)
    return {type: 'joingame', id: gameid, success: true};
}

// Update the number of players for every client in a game with gameid
function updateNumPlayers(gameid) {
    let players = gamesTable[gameid].getPlayers();
    players.forEach((pid) => {
        pidTable[pid].send(JSON.stringify({type: 'numplayers', num: players.length}));
    });
}
