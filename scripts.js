const ws = new WebSocket("ws://localhost:8000");
const message_div = document.getElementById("message-div");

var player = 0;

ws.onmessage = function(msg) {
    var data = JSON.parse(msg.data);
    console.log(data);
    
    switch(data.type) {
        case 'connection':
            if (player == 0)
                player = data.player;
            message_div.innerHTML = `Player ${player}`;
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
