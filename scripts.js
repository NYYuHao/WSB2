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
    console.log(data);
    
    switch(data.type) {
        case 'connection':
            message_div.innerHTML = `Players: ${data.players}`;
            break;
    }
}

// Intentionally disconnect from the server via button press
function disconnect() {
    ws.close();
    message_div.innerHTML = "Disconnected";
}

// Send a message to the server with the user's name
function entername() {
    var data = {
        type: "entername",
        name: document.getElementById("name").value
    };
    message_div.innerHTML = data.name;
    ws.send(JSON.stringify(data));
}
