const ws = new WebSocket("ws://localhost:8000");

const message_div = document.getElementById("message-div");
const main_canvas = document.getElementById("main-canvas");

const width = main_canvas.width = window.innerWidth * .9;
const height = main_canvas.height = window.innerHeight * .9;
const ctx = main_canvas.getContext('2d');

ctx.fillStyle = 'rgb(0, 0, 0)';
ctx.fillRect(0, 0, width, height);

ws.onmessage = function(msg) {
    var data = JSON.parse(msg.data);
    
    switch(data.type) {
        case 'connection':
            message_div.innerHTML = `Players: ${data.players}`;
            break;
        case 'creategame':
            if (data.success)
                message_div.innerHTML = `Game code: ${data.id}`;
            else
                console.error('ERROR: Already in game');
            break;
        case 'joingame':
            if (data.success)
                message_div.innerHTML = `Game code: ${data.id}`;
            else
                console.error('ERROR: Cannot join game');
    }
}

// Intentionally disconnect from the server via button press
function disconnect() {
    ws.close();
    message_div.innerHTML = "Disconnected";
}

// Attempt to create a game via request to the server (fails if already in one)
function creategame() {
    var data = {
        type: "creategame"
    };
    ws.send(JSON.stringify(data));
}

// Attempt to join a game (fails if already in one)
function joingame() {
    var data = {
        type: "joingame",
        gameid: document.getElementById("code").value
    };
    ws.send(JSON.stringify(data));
}
