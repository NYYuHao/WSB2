const {Server} = require('ws');
const wss = new Server({port: 8000});

console.log("Listening on port 8000...");

wss.on('connection', (ws, req) => {
    console.log(`Connection created: ${req.connection.remoteAddress}`);

    // Send a message on initial connection
    var message = { type: 'connection', player: wss.clients.size };
    ws.send(JSON.stringify(message));

    // Handle disconnect
    ws.on('close', (code, reason) => {
        console.log(`Connection closed: ${reason}`);
    })
});
