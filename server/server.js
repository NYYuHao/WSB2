const PORT = process.env.PORT || 3000;

const express = require('express'); 
const server = express()
    .use(express.static(__dirname + '/../client/'))
    .listen(PORT, () => console.log(`Listening on port ${PORT}...`));

const {Server} = require('ws');
const crypto = require('crypto');
const wss = new Server({server});
const Game = require('./game.js');

var gamesTable = {};    // Holds the ongoing games in [id: game] pairs
var pidTable = {}       // Holds {playerid: ws} pairs for all players in a game
var connectionsSet = new Set(); // Set of connected pids (not just those in a game)

wss.on('connection', (ws, req) => {
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
        
        // TODO: Make exception handling more robust
        switch (msg.type) {
            case "creategame":
                try {
                    ws.send(JSON.stringify(createGame(ws)));
                }
                catch (exception) {
                    console.error(exception);
                }
                break;
            case "joingame":
                try {
                    ws.send(JSON.stringify(joinGame(ws, msg.gameid)));
                }
                catch (exception) {
                    console.error(exception);
                }
                break;
            case "startgame":
                try {
                    startGame(ws);
                }
                catch (exception) {
                    console.error(exception);
                }
                break;
            case "playturn":
                try {
                    playTurn(ws, msg.cards);
                }
                catch (exception) {
                    console.error(exception);
                }
                break;
            case "passturn":
                try {
                    passTurn(ws);
                }
                catch (exception) {
                    console.error(exception);
                }
                break;
            case "leavegame":
                try {
                    leaveGame(ws);
                }
                catch (exception) {
                    console.error(exception);
                }
                break;
            default:
                console.error("ERROR: Unrecognized message type");
                break;
        }
    });

    // Handle disconnect
    ws.on('close', (code) => {
        console.log(`Connection closed\tPID: ${ws.pid}`);
        connectionsSet.delete(ws.pid);
        leaveGame(ws);
    })

    // Print errors
    ws.on('error', (error) => {
        console.error(`Websocket error: ${error}`);
    })
});

// Ping all the clients
setInterval(() => {
    wss.clients.forEach((ws) => {
        ws.ping(() => {});
    });
}, 30000);


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
    ws.gameid = gameid;
    
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
    ws.gameid = gameid;

    // Update the members of the game with the player count
    updateNumPlayers(gameid)
    return {type: 'joingame', id: gameid, success: true};
}

// Leave the game for player ws, closing the game if necessary
function leaveGame(ws) {
    if (!pidTable[ws.pid])
        throw 'Invalid attempt to leave game';

    console.log(`Leaving game\tGID: ${ws.gameid}\tPID:${ws.pid}`);
    delete pidTable[ws.pid];

    // If the user was part of a game, remove them from the table
    if (ws.gameid) {
        let game = gamesTable[ws.gameid];

        // If the game was started, close the entire game
        if (game.isGameStarted()) {
            closeGame(ws);
        }
        // Otherwise, just remove this user and close game if necessary
        else {
            if (game.getNumPlayers() > 1) {
                game.removePlayer(ws.pid);
                updateNumPlayers(ws.gameid)
            }
            else {
                console.log(`Closing game\tGID: ${ws.gameid}`);
                delete gamesTable[ws.gameid];
            }
        }
    }
}

// Close the game ws is a part of
// Also remove all players
function closeGame(ws) {
    // Make sure the game still exists
    if (!gamesTable.hasOwnProperty(ws.gameid))
        throw "Invalid attempt to leave game";
    
    console.log(`Closing game\tGID: ${ws.gameid}`);
    let game = gamesTable[ws.gameid];
    
    game.getPlayers().forEach((pid) => {
        if (pid != ws.pid) {
            pidTable[pid].send(JSON.stringify({
                type: 'gamedisconnect'
            }));
            delete pidTable[pid].gameid;
            delete pidTable[pid];
        }
    });

    delete gamesTable[ws.gameid];
}

// Update the number of players for every client in a game with gameid
function updateNumPlayers(gameid) {
    let players = gamesTable[gameid].getPlayers();
    players.forEach((pid) => {
        pidTable[pid].send(JSON.stringify({type: 'numplayers', num: players.length}));
    });
}

// Start the game for all players in a lobby
function startGame(ws) {
    // Ensure that the game exists
    if (!gamesTable.hasOwnProperty(ws.gameid))
        throw "Invalid attempt to start game";

    let game = gamesTable[ws.gameid];
    let players = gamesTable[ws.gameid].getPlayers();

    // Verify that ws is actually a part of game gameid
    if (!players.includes(ws.pid) || players.length < 2)
        throw "Invalid attempt to start game";

    console.log(`Starting game\tGID: ${ws.gameid}`);

    game.initialize();
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
function playTurn(ws, cards) {
    let game = gamesTable[ws.gameid];

    console.log(`Playing cards\tGID: ${ws.gameid}\tCards: ${cards}`);

    let turnResult = game.playTurn(ws.pid, cards);
    // On successful play, let player know and start next turn
    if (turnResult) {
        ws.send(JSON.stringify({type: 'playsuccess'}));

        // Let the current player know it's their turn
        let playerPids = game.getPlayers();
        pidTable[playerPids[turnResult.currentPlayer]].send(
            JSON.stringify({type: 'turnstart'}));

        // Update every player with the play
        playerPids.forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'turncards',
                // Add 1 for frontend rendering
                lastPlayer: turnResult.lastPlayer+1,
                handSize: turnResult.handSize,
                cards: cards
            })));

        // Update every player with the next opponent
        playerPids.forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'updateopponent',
                currentPlayer: turnResult.currentPlayer+1
            })));

        // If the game is over, let the players know who won
        if (turnResult.gameOver) {
            playerPids.forEach((pid) => pidTable[pid].send(
                JSON.stringify({
                    type: 'gameover',
                    winner: turnResult.lastPlayer+1,
                    numWins: game.getWins()
                }
            )));
        }
    }
    else {
        console.error('Invalid attempt to play cards');
    }
}

// Attempt to pass a turn for ws
function passTurn(ws) {
    let game = gamesTable[ws.gameid];

    console.log(`Passing turn\tGID: ${ws.gameid}`);

    let turnResult = game.passTurn(ws.pid)
    if (turnResult) {
        ws.send(JSON.stringify({type: 'passsuccess'}));

        // Let the current player know it's their turn
        let playerPids = game.getPlayers();
        pidTable[playerPids[turnResult.currentPlayer]].send(
            JSON.stringify({type: 'turnstart'}));

        // Update every player with the pass
        playerPids.forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'turnpass', lastPlayer: turnResult.lastPlayer+1
            })));

        // Update every player with the next opponent
        playerPids.forEach((pid) => pidTable[pid].send(
            JSON.stringify({
                type: 'updateopponent',
                currentPlayer: turnResult.currentPlayer+1
            })));
    }
    else {
        console.error('Invalid attempt to pass turn');
    }
}
