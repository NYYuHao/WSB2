// Handles Game logic
// Can build a new instance for every ongoing game
class Game {
    constructor() {
        this.deck = [...Array(52).keys()]; // 0, 1, 2, 3 are Aces (D, C, H, S)
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

    // Compare two hands
    // h1 and h2 are arrays of cards
    // Returns true if h1 has a lower value than h2
    static compareHands(h1, h2) {
        if (h1.length != h2.length) {
            return false;
        }

        // Comparing singles, 2s > As > Ks > Qs ...
        if (h1.length == 1) {
            let c1 = h1[0];
            let c2 = h2[0];
            if (c1 < 8) c1 += 52;
            if (c2 < 8) c2 += 52;
            return c1 < c2;
        }
    }
}

module.exports = Game;
