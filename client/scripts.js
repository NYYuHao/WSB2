const ws = new WebSocket("ws://localhost:8000");

const message_div = document.getElementById("message-div");
const join_form = document.getElementById("join-form");
const main_canvas = document.getElementById("main-canvas");
const start_div = document.getElementById("start-div");
const num_players = document.getElementById("num-players");
const hand_div = document.getElementById("hand");
var gameid = null;

ws.onmessage = function(msg) {
    var data = JSON.parse(msg.data);
    
    switch (data.type) {
        case 'notification':
            message_div.innerHTML = data.text;
            break;
        case 'creategame':
        case 'joingame':
            if (data.success) {
                message_div.innerHTML = `Game code: ${data.id}`;
                gameid = data.id;
                startGameHTML();
            }
            else
                console.error('ERROR: Cannot create/join game');
            break;
        case 'numplayers':
            num_players.innerHTML = `${data.num} player(s)`;
            break;
        case 'gethand':
            renderHand(data.hand);
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

// Attempt to start a game for the given room
function startGame() {
    var data = {
        type: "startgame",
        gameid: gameid
    }
    ws.send(JSON.stringify(data));
}


// HTML Updates

// Update the HTML with the start game button
function startGameHTML() {
    var startButton = document.createElement("button");
    startButton.id = "start-button";
    startButton.onmouseup = startGame;
    startButton.innerHTML = "Start Game";
    start_div.appendChild(startButton);
}

// Render the hand returned by the server
// Use when game first starts
function renderHand(hand) {
    hand.sort((a, b) => a-b);
    for (let i = 0; i < hand.length; i++) {
        let card = document.createElement("div");
        card.className = 'card';
        
        // Card value
        let value = Math.floor((hand[i]+4)/4).toString();
        switch (value) {
            case '1': 
                value = 'A';
                break;
            case '11':
                value = 'J';
                break;
            case '12':
                value = 'Q';
                break;
            case '13':
                value = 'K';
                break;
        }

        // Card suit
        let suit = hand[i]%4;
        switch (suit) {
            case 0:
                suit = '&diams;';
                card.style.color = 'red';
                break;
            case 1:
                suit = '&clubs;';
                card.style.color = 'black';
                break;
            case 2:
                suit = '&hearts;';
                card.style.color = 'red';
                break;
            case 3:
                suit = '&spades;';
                card.style.color = 'black';
                break;
        }

        card.innerHTML = '<p>' + value + '<br>' + suit + '</p>';

        hand_div.appendChild(card);
    }
}
