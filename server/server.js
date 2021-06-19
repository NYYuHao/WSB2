const {Server} = require('ws');
const crypto = require('crypto');
const wss = new Server({port: 8000});
const Game = require('./game.js');

var gamesTable = {};    // Holds the ongoing games in [id: game] pairs
var pidTable = {}       // Holds {playerid: ws} pairs for all players in a game
var connectionsSet = new Set(); // Set of connected pids (not just those in a game)

console.log("Listening on port 8000...");
wss.on('connection', (ws, req) => {
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

    console.log(`Connection created\tIP: ${req.connection.remoteAddress}\tPID: ${pid}`);

    // Handle messages from client
    ws.on('message', (data) => {
        let msg = JSON.parse(data);
        
        switch (msg.type) {
            case "creategame":
                ws.send(JSON.stringify(createGame(ws)));
                break;
            case "joingame":
                ws.send(JSON.stringify(joinGame(ws, msg.gameid)));
                break;
            case "startgame":
                ws.send(JSON.stringify(startGame(ws, msg.gameid)));
                break;
            case "playturn":
                ws.send(JSON.stringify(playTurn(ws, msg.gameid, msg.cards)));
                break;
            case "passturn":
                ws.send(JSON.stringify(passTurn(ws, msg.gameid)));
                break;
            default:
                console.error("ERROR: Unrecognized message type");
                break;
        }
    });

    // Handle disconnect
    ws.on('close', (code) => {
        console.log(`Connection closed\tPID: ${ws.pid}`);
    })
});


// Create a game for player ws and add it to the gamesTable
// Returns the resulting randomly generated id and whether the game was created
function createGame(ws) {
    // Don't create a game if the player is already in one
    if (pidTable.hasOwnProperty(ws.pid))
        return {type: 'creategame', id: null, success: false};

    // Repeatedly generate an ID until one is unique
    let gameid;
    do {
        gameid = crypto.randomBytes(3).toString('hex');
    } while (gamesTable.hasOwnProperty(gameid));

    console.log(`Creating game\tGID: ${gameid}\tPID: ${ws.pid}`);

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

    console.log(`Joining game\tGID: ${gameid}\tPID: ${ws.pid}`);

    // Attempt to add player to game
    try {
        gamesTable[gameid].addPlayer(ws.pid);
    } catch (error) {
        console.error(error);
        return {type: 'joingame', id: null, success: false};
    }
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

// Start the game for all players in a lobby
function startGame(ws, gameid) {
    let game = gamesTable[gameid];
    let players = gamesTable[gameid].getPlayers();

    // Verify that ws is actually a part of game gameid
    // TODO: Maybe make this return something instead of throw?
    if (!players.includes(ws.pid)) throw "Invalid attempt to start game";

    console.log(`Starting game\tGID: ${gameid}`);

    game.shuffle();
    game.deal();
    for (let i = 0; i < players.length; i++) {
        pidTable[players[i]].send(JSON.stringify(
            {
                type: 'startgame',
                hand: game.getHand(players[i]),
                opponents: game.getOpponents(players[i])
            }
        ));
    }

    // Start game, send 'turnstart' to the first player
    // and update opponents to show current player
    let startResult = game.startGame();
    let firstPid = startResult.firstPid;
    pidTable[firstPid].send(JSON.stringify({type: 'turnstart'}));
    game.getPlayers().forEach((pid) => pidTable[pid].send(
        JSON.stringify({
            type: 'updateopponent',
            currentPlayer: startResult.firstPlayer+1
        })));
}

// Attempt to play a turn based on the cards received by ws
function playTurn(ws, gameid, cards) {
    let game = gamesTable[gameid];

    console.log(`Playing cards\tGID: ${gameid}\tCards: ${cards}`);

    let turnResult = game.playTurn(ws.pid, cards);
    // On successful play, let player know and start next turn
    if (turnResult) {
        ws.send(JSON.stringify({type: 'playsuccess'}));
        // TODO: This is sometimes NOT sending to the right player
        pidTable[game.getPlayers()[turnResult.currentPlayer]].send(
            JSON.stringify({type: 'turnstart'}));
        game.getPlayers().forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'turncards',
                // Add 1 for frontend rendering
                lastPlayer: turnResult.lastPlayer+1,
                handSize: turnResult.handSize,
                cards: cards
            })));
        game.getPlayers().forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'updateopponent',
                currentPlayer: turnResult.currentPlayer+1
            })));
    }
    else {
        console.error('Invalid attempt to play cards');
    }
}

// Attempt to pass a turn for ws
function passTurn(ws, gameid) {
    let game = gamesTable[gameid];

    console.log(`Passing turn\tGID: ${gameid}`);

    let turnResult = game.passTurn(ws.pid)
    if (turnResult) {
        ws.send(JSON.stringify({type: 'passsuccess'}));
        pidTable[game.getPlayers()[turnResult.currentPlayer]].send(
            JSON.stringify({type: 'turnstart'}));
        game.getPlayers().forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'turnpass', lastPlayer: turnResult.lastPlayer+1
            })));
        game.getPlayers().forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'updateopponent',
                currentPlayer: turnResult.currentPlayer+1
            })));
    }
    else {
        console.error('Invalid attempt to pass turn');
    }
}
