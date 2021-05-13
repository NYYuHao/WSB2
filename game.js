// Handles Game logic
// Can build a new instance for every ongoing game
class Game {
    constructor() {
        this.deck = [...Array(52).keys()];
        this.currentPlayer = 0;
        this.numPlayers = 0;
        this.playerHands = [[], [], [], []];
    }

    // Shuffle the current deck
    shuffle() {
        
    }

    // Distribute the deck into four hands, simulating an actual deal
    deal() {
        let cut = this.deck[Math.floor(Math.random() * 52)];

        for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 4; j++) {
                this.playerHands[(j+cut)%4].push(this.deck[(i*4)+j]);
            }
        }

        console.log(this.playerHands);
    }
}

module.exports = Game;
