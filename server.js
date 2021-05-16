const {Server} = require('ws');
const crypto = require('crypto');
const wss = new Server({port: 8000});
const Game = require('./game.js');

// gamesTable holds the ongoing games in [id: {game, players}] pairs
var gamesTable = {};

console.log("Listening on port 8000...");
wss.on('connection', (ws, req) => {
    console.log(`Connection created: ${req.connection.remoteAddress}`);

    // Send a message on initial connection
    let initial = { type: 'connection', players: wss.clients.size };
    ws.send(JSON.stringify(initial));

    // Handle messages from client
    ws.on('message', (data) => {
        let msg = JSON.parse(data);
        
        switch(msg.type) {
            case "creategame":
                console.log("Creating game");
                let gameid = createGame();
                ws.send(JSON.stringify({ type: 'creategame', id: gameid}));
                break;
            default:
                console.log("Unrecognized message type");
                break;
        }
    });

    // Handle disconnect
    ws.on('close', (code, reason) => {
        console.log(`Connection closed: ${reason}`);
    })
});


// Create a game and add it to the gamesTable
// Returns the resulting randomly generated id
function createGame() {
    let id = crypto.randomBytes(3).toString('hex');
    gamesTable[id] = {
        game: new Game(),
        players: []
    };
    return id;
};
