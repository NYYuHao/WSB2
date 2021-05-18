const ws = new WebSocket("ws://localhost:8000");

const message_div = document.getElementById("message-div");
const join_form = document.getElementById("join-form");
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
        case 'joingame':
            if (data.success) {
                message_div.innerHTML = `Game code: ${data.id}`;
                enterGame();
            }
            else
                console.error('ERROR: Cannot create/join game');
            break;
    }
}

// Intentionally disconnect from the server via button press
function disconnect() {
    ws.close();
    message_div.innerHTML = "Disconnected";
}

// Attempt to create a game via request to the server (fails if already in one)
function createGame() {
    var data = {
        type: "creategame"
    };
    ws.send(JSON.stringify(data));
}

// Attempt to join a game (fails if already in one)
function joinGame() {
    var data = {
        type: "joingame",
        gameid: document.getElementById("code").value
    };
    ws.send(JSON.stringify(data));
}

// Change the HTML when the player is part of a game
function enterGame() {
    var startDiv = document.createElement("div");

    // TODO: This should add the number of players in the game
    var numPlayerText = document.createElement("p");
    numPlayerText.id = "num-players";
    numPlayerText.appendChild(document.createTextNode("Connected"));

    var startButton = document.createElement("button");
    startButton.id = "start-button";
    startButton.onmouseup = startGame;
    startButton.innerHTML = "Start Game";

    startDiv.appendChild(numPlayerText);
    startDiv.appendChild(startButton);

    join_form.parentNode.insertBefore(startDiv, join_form.nextSibling);
}

// Attempt to start a game for the given room
function startGame() {

}
