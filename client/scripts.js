const HOST = location.origin.replace(/^http/, 'ws');
const ws = new WebSocket(HOST);

const message_div = document.getElementById("message-div");
const game_settings_div = document.getElementById("game-settings");
const start_button = document.getElementById("start-button");
const num_players = document.getElementById("num-players");
const plays_div = document.getElementById("plays");
const hand_div = document.getElementById("hand");
const game_div = document.getElementById("game");
const game_buttons_div = document.getElementById("game-buttons");
const opponent_divs = [
    document.getElementById("right-player"),
    document.getElementById("top-player"),
    document.getElementById("left-player")
];
const gameover_overlay = document.getElementById("gameover-overlay");
const gameover_header = document.getElementById("gameover-header");
const gameover_text = document.getElementById("gameover-text");
const restart_button = document.getElementById("restart-button");
const leave_button = document.getElementById("leave-button");
const home_button = document.getElementById("home-button");

var numPlays = 0; 
var handCards = new Set();          // Set representing client hand
var selectedCards = new Set();      // Set representing selected cards
var selectedCardDivs = new Set();   // Set representing selected divs
var opponent_info = {};             // Object of opponentNum: {divs} pairs

ws.onmessage = function(msg) {
    var data = JSON.parse(msg.data);
    
    switch (data.type) {
        case 'creategame':
        case 'joingame':
            if (data.success) {
                message_div.innerHTML = `Game code: ${data.id}`;
                displayStart();
            }
            else
                console.error('ERROR: Cannot create/join game');
            break;
        case 'numplayers':
            num_players.innerHTML = `${data.num} player(s)`;
            break;
        case 'startgame':
            initializePlayerInfo(data.opponents);
            displayGameInfo();
            undisplayTurn();
            renderHand(data.hand);
            undisplaySettings();
            break;
        case 'turnstart':
            displayTurn();
            break;
        case 'playsuccess':
            undisplayTurn();
            clearSets();
            break;
        case 'passsuccess':
            undisplayTurn();
            break;
        case 'turncards':
            updateOpponentInfo(data.handSize, data.lastPlayer);
            displayTurnCards(data.cards, data.lastPlayer);
            break;
        case 'turnpass':
            updateOpponentInfo(data.handSize, data.lastPlayer);
            displayTurnPass(data.lastPlayer);
            break;
        case 'updateopponent':
            updateOpponentColor(data.currentPlayer);
            break;
        case 'gameover':
            displayGameOver(data.winner, data.numWins);
            break;
        case `gamedisconnect`:
            displayGameDisconnect();
            break;
    }
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
        type: "startgame"
    };
    ws.send(JSON.stringify(data));
}

// Attempt to leave a game (and close it for all players)
function leaveGame() {
    var data = {
        type: "leavegame"
    };
    ws.send(JSON.stringify(data));
    displaySettings();
}

// Select or deselect a card by adding/removing it in selectedCards
// cardDiv refers to the card element
// cardVal refers to the numerical value
function selectCard(cardDiv, cardVal) {
    if (cardDiv.classList.contains('unselected')) {
        selectedCards.add(cardVal);
        selectedCardDivs.add(cardDiv);
        cardDiv.className = 'card selected';
    }
    else {
        selectedCards.delete(cardVal);
        selectedCardDivs.delete(cardDiv);
        cardDiv.className = 'card unselected';
    }
}

// Attempt to send the selected cards
function sendCards() {
    var data = {
        type: "playturn",
        cards: Array.from(selectedCards)
    };
    ws.send(JSON.stringify(data));
}

// Attempt to pass turn
function passTurn() {
    var data = {
        type: "passturn",
    };
    ws.send(JSON.stringify(data));
}

// Turn card into object for HTML
// e.g. 3 --> {A, Spade, Black}
function cardToObject(card) {
    let value = Math.floor((card+4)/4).toString();
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
    let suit = card%4;
    let color;
    switch (suit) {
        case 0:
            suit = '&diams;';
            color = 'red';
            break;
        case 1:
            suit = '&clubs;';
            color = 'black';
            break;
        case 2:
            suit = '&hearts;';
            color = 'red';
            break;
        case 3:
            suit = '&spades;';
            color = 'black';
            break;
    }
    return {value: value, suit: suit, color: color};
}


// HTML Updates

// Initialize player map with relevant divs based on opponents
// TODO: Maybe don't call this on every game restart
function initializePlayerInfo(opponents) {
    numPlays = 0;

    for (i = 0; i < opponents.length; i++) {
        let opponent_div = opponent_divs[i];
        opponent_div.innerHTML = `Player ${opponents[i].opponentNum}`;
        opponent_div.style.background = '#EDEDED';

        let opponent_card = document.createElement("div");
        opponent_card.className = 'info-card played-card';
        opponent_card.innerHTML = opponents[i].opponentHandSize;
        opponent_div.appendChild(opponent_card);

        // Store opponent card and div for use later
        opponent_info[opponents[i].opponentNum] = {
            infoContainer: opponent_div,
            infoCard: opponent_card
        }

        opponent_div.style.display = "block";
    }
}

// Display game info at the start of a game
// Remove plays from previous games and display hand
function displayGameInfo() {
    game_div.style.display = 'flex';
    plays_div.style.display = 'flex';
    while (plays_div.firstChild) {plays_div.removeChild(plays_div.lastChild);}
}

// Display game settings div
// and remove all game divs
function displaySettings() {
    gameover_overlay.style.display = 'none';
    game_settings_div.style.display = 'block';
    game_div.style.display = 'none';
    message_div.innerHTML = 'Game code:'
    num_players.innerHTML = '';
    start_button.style.display = 'none';
}

// Remove the game settings div
function undisplaySettings() {
    gameover_overlay.style.display = 'none';
    game_settings_div.style.display = 'none';
}

// Render the hand returned by the server
// Use when game first starts
function renderHand(hand) {
    // Remove any cards already present
    while (hand_div.firstChild) {hand_div.removeChild(hand_div.lastChild);}
    handCards.clear();
    selectedCards.clear();

    // Render the cards
    hand.sort((a, b) => a-b);
    for (let i = 0; i < hand.length; i++) {

        // Add card to client's hand
        handCards.add(hand[i]);

        // Create div to render card
        let card = document.createElement("div");
        card.className = 'card unselected';
        
        let stats = cardToObject(hand[i]);

        card.innerHTML = '<p>' + stats.value + '<br>' + stats.suit + '</p>';
        card.style.color = stats.color;
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
    game_buttons_div.style.display = 'flex';
}

// After the user takes their turn, undisplay send and pass
function undisplayTurn() {
    game_buttons_div.style.display = 'none';
}

// Clears the selected cards and removes them from display
function clearSets() {
    selectedCardDivs.forEach((div) => div.remove());
    selectedCards.clear();
    selectedCardDivs.clear();
}

// Adds a div turn to plays, removing old ones if necessary
function addPlay(turn) {
    plays_div.appendChild(turn);
    if (numPlays >= 5)
        plays_div.removeChild(plays_div.childNodes[0]);
    else
        numPlays++;
}

// Whenever cards are played, update the opponent's hand size
// and return background to normal
function updateOpponentInfo(handSize, lastPlayer) {
    // Skip if attempting to update self
    if (opponent_info.hasOwnProperty(lastPlayer)) {
        if (handSize) opponent_info[lastPlayer].infoCard.innerHTML = `${handSize}`;
        opponent_info[lastPlayer].infoContainer.style.background = '#EDEDED';
    }
}

// Update the currentPlayer to show whose turn it is
function updateOpponentColor(currentPlayer) {
    if (opponent_info.hasOwnProperty(currentPlayer)) {
        opponent_info[currentPlayer].infoContainer.style.background = '#B5B5B5';
    }
}

// Displays the cards played in the previous turn
function displayTurnCards(cards, playerNum) {
    let turn = document.createElement('div');
    turn.innerHTML = `Player ${playerNum}: `;
    turn.className = 'turn';
    // Render every played card
    for (let i = 0; i < cards.length; i++) {
        let card = document.createElement('div');
        card.className = "played-card";
        let stats = cardToObject(cards[i]);
        card.innerHTML = stats.value + stats.suit;
        card.style.color = stats.color;
        turn.appendChild(card);
    }
    addPlay(turn);
}

// Display a turn pass
function displayTurnPass(playerNum) {
    let turn = document.createElement('div');
    turn.innerHTML = `Player ${playerNum}: Pass`;
    turn.className = 'turn';
    addPlay(turn);
}

// Display the gameover overlay when the game is over with the winner
// and the number of wins for every player so far
function displayGameOver(winner, numWins) {
    gameover_overlay.style.display = 'block';
    gameover_header.innerHTML = `Player ${winner} won!`;
    while (gameover_text.firstChild)
        {gameover_text.removeChild(gameover_text.lastChild);}
    for (let i = 0; i < numWins.length; i++) {
        let p = document.createElement("p");
        p.appendChild(
            document.createTextNode(`Player ${i+1}: ${numWins[i]} wins`));
        gameover_text.appendChild(p);
    }
    restart_button.style.display = 'block';
    leave_button.style.display = 'block';
    home_button.style.display = 'none';
}

// Display the gameover overlay with disconnect text, prompting game leave
function displayGameDisconnect() {
    gameover_overlay.style.display = 'block';
    gameover_header.innerHTML = "Player disconnected";
    while (gameover_text.firstChild)
        {gameover_text.removeChild(gameover_text.lastChild);}
    restart_button.style.display = 'none';
    leave_button.style.display = 'none';
    home_button.style.display = 'block';
}
