const {Server} = require('ws');
const wss = new Server({port: 8000});
const Game = require('./game.js');

console.log("Listening on port 8000...");

wss.on('connection', (ws, req) => {
    console.log(`Connection created: ${req.connection.remoteAddress}`);

    // Send a message on initial connection
    var initial = { type: 'connection', players: wss.clients.size };
    ws.send(JSON.stringify(initial));

    // Handle messages from client
    ws.on('message', (data) => {
        var msg = JSON.parse(data);
        
        switch(msg.type) {
            case "entername":
                console.log(`Received name: ${msg.name}`)
                break;
            default:
                console.log("Unrecognized message type");
        }
    });

    // Handle disconnect
    ws.on('close', (code, reason) => {
        console.log(`Connection closed: ${reason}`);
    })
});

