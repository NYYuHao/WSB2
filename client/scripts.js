const ws = new WebSocket("ws://localhost:8000");

const message_div = document.getElementById("message-div");
const join_form = document.getElementById("join-form");
const main_canvas = document.getElementById("main-canvas");
const start_div = document.getElementById("start-div");
const start_button = document.getElementById("start-button");
const num_players = document.getElementById("num-players");
const hand_div = document.getElementById("hand");
const send_button = document.getElementById("send-button");
const pass_button = document.getElementById("pass-button");
var gameid = null;

let handCards = new Set()       // Set representing client hand
let selectedCards = new Set()   // Set representing selected cards

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
                displayStart();
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
        case 'turnstart':
            displayTurn();
            break;
        case 'playsuccess':
            undisplayTurn();
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
    };
    ws.send(JSON.stringify(data));
}

// Select or deselect a card by adding/removing it in selectedCards
// cardDiv refers to the card element
// cardVal refers to the numerical value
function selectCard(cardDiv, cardVal) {
    if (cardDiv.classList.contains('unselected')) {
        selectedCards.add(cardVal);
        cardDiv.className = 'card selected';
    }
    else {
        selectedCards.delete(cardVal);
        cardDiv.className = 'card unselected';
    }
}

// Attempt to send the selected cards
function sendCards() {
    var data = {
        type: "playturn",
        gameid: gameid,
        cards: Array.from(selectedCards)
    };
    ws.send(JSON.stringify(data));
}


// HTML Updates

// Render the hand returned by the server
// Use when game first starts
function renderHand(hand) {
    // Render the cards
    hand.sort((a, b) => a-b);
    for (let i = 0; i < hand.length; i++) {

        // Add card to client's hand
        handCards.add(hand[i]);

        // Create div to render card
        let card = document.createElement("div");
        card.className = 'card unselected';
        
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
        card.addEventListener('click', () => selectCard(card, hand[i]));
        hand_div.appendChild(card);
    }
}

// Update the HTML with the start game button
function displayStart() {
    start_button.style.display = 'block';
}

// When it's the user's turn, display send and pass button
function displayTurn() {
    send_button.style.display = 'block';
    pass_button.style.display = 'block';
}

// After the user takes their turn, undisplay send and pass
// and display the played hand
function undisplayTurn() {
    send_button.style.display = 'none';
    pass_button.style.display = 'none';
}
