// Handles Game logic
// Can build a new instance for every ongoing game
class Game {
    constructor() {
        this.deck = [...Array(52).keys()]; // 0, 1, 2, 3 are Aces (D, C, H, S)
        this.numPlayers = 0;
        this.currentPlayer = 0;
        this.turn = 0;
        this.playerHands = [new Set(), new Set(), new Set(), new Set()];
        this.playerOrder = {}; // {pid: playernum} pairs
        this.lastCards = []; // Most recent play
    }

    // Shuffle the current deck
    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }       
    }

    // Distribute the deck into four hands, simulating an actual deal
    deal() {
        let cut = this.deck[Math.floor(Math.random() * 52)];

        for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 4; j++) {
                this.playerHands[(j+cut)%4].add(this.deck[(i*4)+j]);
            }
        }
    }


    // Server logic

    // Return an array copy of the player hand belonging to player id pid
    getHand(pid) {
        return Array.from(this.playerHands[this.playerOrder[pid]]);
    }

    // Add a player pid to the game
    addPlayer(pid) {
        if (this.numPlayers > 3) throw "Invalid attempt to add player";
        this.playerOrder[pid] = this.numPlayers++;
    }

    // Return an array copy of the pids in the game
    getPlayers() {
        return Object.keys(this.playerOrder);
    }

    // Start the game (i.e. determine player order, return start pid)
    startGame() {
        // TODO: Assert that game has players?
        // Find which player has closest to 3ofD
        let mins = [];
        for (let i = 0; i < this.numPlayers; i++ ) {
            let fh = Array.from(this.playerHands[i])
                .map((card) => (card < 8) ? card + 52 : card);
            mins.push(Math.min(...fh));
        }
        this.currentPlayer = mins.indexOf(Math.min(...mins));
        return Object.keys(this.playerOrder)
            .find((pid) => this.playerOrder[pid] == this.currentPlayer);
    }

    // Play a turn with the given cards
    playTurn(pid, cards) {
        let playerNum = this.playerOrder[pid];
        // Make sure it's the player's turn
        if (playerNum != this.currentPlayer)
            return false;
        console.log("Success");
        // Make sure all the cards are owned by the player
        if (!cards.every((card) => this.playerHands[playerNum].has(card)))
            return false;
        console.log("Success");
        // Make sure hand is playable
        if (!Game.compareHands(this.lastCards, cards))
            return false;
        console.log("Success");
        // Remove cards from hand
        cards.forEach((card) => this.playerHands[playerNum].delete(card));
        this.lastCards = cards;
        this.currentPlayer = (this.currentPlayer+1)%this.numPlayers;
        this.turn++;
        return {currentPlayer: this.currentPlayer, turn: this.turn};
    }

    // Game logic

    // Return true if h is a pair
    static isPair(h) {
        return (h.length == 2 && Math.floor(h[0]/4) == Math.floor(h[1]/4));
    }

    // Return true if h is a three of a kind
    static isThreeOfKind(h) {
        return (h.length == 3 && Math.floor(h[0]/4) == Math.floor(h[1]/4)
            && Math.floor(h[1]/4) == Math.floor(h[2]/4));
    }

    // Return true if h is a straight
    // h must be sorted and "fixed" as defined in compareHands()
    static isStraight(h) {
        if (h.length != 5) return false;

        let hnums = h.map((card) => Math.floor(card/4));
        // If the hand has a three, then A 2 3 4 5 etc. is possible
        // Otherwise if the hand has a two, then there's no straight (i.e. J Q K A 2)
        if (hnums[0] == 2)
            hnums = hnums.map((card) => card%13); // "unfix" cards for A-5 or 2-6
        else if (hnums[4] == 14) return false;
        hnums.sort((a, b) => a-b)     // Sort numerically

        // Check for values incrementing by one
        for (let i = 0; i < 4; i++) {
            if (hnums[i] != hnums[i+1]-1)
                return false;
        }
        return true;
    }

    // Return true if h is a flush
    static isFlush(h) {
        if (h.length != 5) return false;
        let suit = h[0]%4;
        return h.every((card) => card%4 == suit);
    }

    // Return true if h is a full house
    static isFullHouse(h) {
        if (h.length != 5) return false;
        let cardCount = {};
        for (let i = 0; i < 5; i++) {
            let value = Math.floor(h[i]/4);
            let count = cardCount[value] ? cardCount[value] + 1 : 1;
            cardCount[value] = count;
        }
        let countArray = Object.values(cardCount).sort();
        return countArray[0] == 2 && countArray[1] == 3;
    }

    // Return true if h is a four of a kind
    static isFourOfKind(h) {
        if (h.length != 5) return false;
        let cardCount = {};
        for (let i = 0; i < 5; i++) {
            let value = Math.floor(h[i]/4);
            let count = cardCount[value] ? cardCount[value] + 1 : 1;
            cardCount[value] = count;
        }
        let countArray = Object.values(cardCount).sort();
        return countArray[0] == 1 && countArray[1] == 4;
    }

    // Returns the most common card value in a hand
    // If there are multiple modes, return the greatest
    // Helpful for comparing full houses and four of a kinds
    static handMode(h) {
        let cardCount = {};
        for (let i = 0; i < 5; i++) {
            let value = Math.floor(h[i]/4);
            let count = cardCount[value] ? cardCount[value] + 1 : 1;
            cardCount[value] = count;
        }
        let mode = null;
        let count = 0;
        for (let value in cardCount) {
            if (cardCount[value] > count ||
                (cardCount[value] == count && value > mode)) {
                mode = parseInt(value);
                count = cardCount[value];
            }
        }
        return mode;
    }

    // Compare two hands
    // h1 and h2 are arrays of unique cards
    // Returns true if h2 is a valid, stronger hand than h1
    static compareHands(h1, h2) {
        if (h1.length == 0) return true;
        if (h1.length != h2.length) return false;

        // "Fix" the cards so that As and 2s are highest value
        let fh1 = h1.map((card) => (card < 8) ? card + 52 : card);
        let fh2 = h2.map((card) => (card < 8) ? card + 52 : card);
        // Sort for convenience
        fh1.sort((a, b) => a-b);
        fh2.sort((a, b) => a-b);

        // Comparing singles, 2s > As > Ks > Qs ...
        if (fh1.length == 1) {
            return fh1[0] < fh2[0];
        }
        // Comparing pairs
        if (Game.isPair(fh1) && Game.isPair(fh2)) {
            return Math.max(...fh1) < Math.max(...fh2);
        }
        // Comparing three of a kinds
        if (Game.isThreeOfKind(fh1) && Game.isThreeOfKind(fh2)) {
            return Math.max(...fh1) < Math.max(...fh2);
        }
        // Comparing five card hands
        if (fh1.length == 5) {
            // fh2 is a straight flush
            if (Game.isStraight(fh2) && Game.isFlush(fh2)) {
                if (Game.isStraight(fh1) && Game.isFlush(fh1))
                    return Math.max(...fh1) < Math.max(...fh2);
                return true;
            }
            // fh2 is a four of a kind
            if (Game.isFourOfKind(fh2)) {
                if (Game.isStraight(fh1) && Game.isFlush(fh1))
                    return false;
                if (Game.isFourOfKind(fh1))
                    return Game.handMode(fh1) < Game.handMode(fh2);
                return true;
            }
            // fh2 is a full house
            if (Game.isFullHouse(fh2)) {
                if ((Game.isStraight(fh1) && Game.isFlush(fh1)) ||
                    Game.isFourOfKind(fh1))
                    return false;
                if (Game.isFullHouse(fh1))
                    return Game.handMode(fh1) < Game.handMode(fh2);
                return true;
            }
            // fh2 is a flush
            if (Game.isFlush(fh2)) {
                if ((Game.isStraight(fh1) && Game.isFlush(fh1)) ||
                    Game.isFourOfKind(fh1) || Game.isFullHouse(fh1))
                    return false;
                if (Game.isFlush(fh1)) {
                    let ch1 = fh1.map((card) => Math.floor(card/4));
                    let ch2 = fh2.map((card) => Math.floor(card/4));
                    for (let i = 4; i >= 0; i--) {
                        if (ch1[i] != ch2[i])
                            return ch1[i] < ch2[i];
                    }
                    return false
                }
                return true;
            }
            // fh2 is a straight
            if (Game.isStraight(fh2)) {
                if ((Game.isStraight(fh1) && Game.isFlush(fh1)) ||
                    Game.isFourOfKind(fh1) || Game.isFullHouse(fh1) ||
                    Game.isFlush(fh1))
                    return false;
                if (Game.isStraight(fh1))
                    return Math.max(...fh1) < Math.max(...fh2);
                return true;
            }
            // fh2 is an invalid five card hand
            return false;
        }
        // fh1 or fh2 is an invalid hand
        return false;
    }
}

module.exports = Game;
