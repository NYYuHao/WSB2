// Handles Game logic
// Can build a new instance for every ongoing game
class Game {
    constructor() {
        this.deck = [...Array(52).keys()]; // 0, 1, 2, 3 are Aces (D, C, H, S)
        this.currentPlayer = 0;
        this.numPlayers = 0;
        this.playerHands = [new Set(), new Set(), new Set(), new Set()];
    }

    // Shuffle the current deck
    shuffle() {
        
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
    // Maybe should just use this code within compareHands directly so comparison is easier
    static isFullHouse(h) {
//        if (h.length != 5) return false;
//        let cardCount = new Map();
//        for (let i = 0; i < 5; i++) {
//            let value = Math.floor(h[i]/4);
//            let count = cardCount.has(value) ? cardCount.get(value) + 1 : 1;
//            cardCount.set(value, count);
//        }
    }

    // Compare two hands
    // h1 and h2 are arrays of cards
    // Returns true if h1 has a lower value than h2
    static compareHands(h1, h2) {
        if (h1.length != h2.length) {
            return false;
        }

        // "Fix" the cards so that As and 2s are highest value
        let fh1 = h1.map((card) => { (card < 8) ? card + 52 : card; });
        let fh2 = h2.map((card) => { (card < 8) ? card + 52 : card; });
        // Sort for convenience
        fh1.sort((a, b) => a-b);
        fh2.sort((a, b) => a-b);

        // Comparing singles, 2s > As > Ks > Qs ...
        if (fh1.length == 1) {
            return fh1[0] < fh2[0];
        }
        // Comparing pairs
        if (isPair(fh1) && isPair(fh2)) {
            return Math.max(...fh1) < Math.max(...fh2);
        }
        // Comparing three of a kinds
        if (isThreeOfKind(fh1) && isThreeOfKind(fh2)) {
            return Math.max(...fh1) < Math.max(...fh2);
        }
        // Comparing five card hands
        if (fh1.length == 5) {
            
        }
    }
}

module.exports = Game;
