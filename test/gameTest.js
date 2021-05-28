const Game = require('../server/game.js');

const game = new Game();
// Shuffle and deal
game.shuffle();
game.deal();
console.log(game.playerHands);

let single1 = [8];
let single2 = [9];

console.log("Testing pairs");
let pair1 = [8, 9];
let pair2 = [10, 11];
let pair3 = [8, 11];
let invPair1 = [8, 12];
console.assert(Game.isPair(pair1), pair1);
console.assert(Game.isPair(pair2), pair2);
console.assert(Game.isPair(pair3), pair3);
console.assert(!Game.isPair(single1), single1);
console.assert(!Game.isPair(invPair1), invPair1);

console.log("Testing three of a kinds");
let threeOfKind1 = [8, 9, 10];
let threeOfKind2 = [12, 13, 14];
let invThreeOfKind1 = [8, 9, 12];
console.assert(Game.isThreeOfKind(threeOfKind1), threeOfKind1);
console.assert(Game.isThreeOfKind(threeOfKind2), threeOfKind2);
console.assert(!Game.isThreeOfKind(pair1), pair1);
console.assert(!Game.isThreeOfKind(single1), single1);
console.assert(!Game.isThreeOfKind(invThreeOfKind1), invThreeOfKind1);

console.log("Testing flushes");
let flush1 = [8, 12, 16, 20, 24];
let invFlush1 = [8, 11, 16, 20, 24];
console.assert(Game.isFlush(flush1), flush1);
console.assert(!Game.isFlush(invFlush1), invFlush1);

console.log("Testing straights");
let straight1 = [9, 14, 19, 20, 27];
let straight2 = [8, 12, 16, 52, 56];
let straight3 = [8, 12, 16, 20, 57];
let straight4 = [36, 40, 44, 48, 53];
let invStraight1 = [40, 44, 48, 52, 56];
console.assert(Game.isStraight(straight1), straight1);  // 3 4 5 6 7
console.assert(Game.isStraight(straight2), straight2);  // A 2 3 4 5
console.assert(Game.isStraight(straight3), straight3);  // 2 3 4 5 6
console.assert(Game.isStraight(straight4), straight4);  // 0 J Q K A
console.assert(!Game.isStraight(invStraight1), invStraight1); // J Q K A 2

console.log("Testing full houses");
let fullHouse1 = [8, 9, 12, 13, 14];
let fullHouse2 = [8, 9, 10, 13, 14];
let fourOfKind1 = [8, 9, 10, 11, 14];
let fourOfKind2 = [8, 12, 13, 14, 15];
console.assert(Game.isFullHouse(fullHouse1), fullHouse1);
console.assert(Game.isFullHouse(fullHouse2), fullHouse2);
console.assert(!Game.isFullHouse(fourOfKind1), fourOfKind1);

console.log("Testing four of a kinds");
console.assert(!Game.isFourOfKind(fullHouse1), fullHouse1);
console.assert(!Game.isFourOfKind(fullHouse2), fullHouse2);
console.assert(Game.isFourOfKind(fourOfKind1), fourOfKind1);
console.assert(Game.isFourOfKind(fourOfKind2), fourOfKind2);

console.log("Testing hand comparisons");
// Mismatched hand sizes should return false
console.assert(!Game.compareHands(single1, pair1));
console.assert(!Game.compareHands(pair1, single1));
// Singles
console.assert(Game.compareHands(single1, single2));
console.assert(!Game.compareHands(single2, single1));
// Pairs
console.assert(Game.compareHands(pair1, pair2));
console.assert(!Game.compareHands(pair2, pair1));
console.assert(Game.compareHands(pair1, pair3));
console.assert(!Game.compareHands(pair3, pair2));   // Pairs with same card?
console.assert(!Game.compareHands(pair2, pair3));
console.assert(!Game.compareHands(pair1, invPair1)); // Invalid always is false
console.assert(!Game.compareHands(invPair1, pair1));
// Three of a Kinds
console.assert(Game.compareHands(threeOfKind1, threeOfKind2));
console.assert(!Game.compareHands(threeOfKind2, threeOfKind1));
console.assert(!Game.compareHands(threeOfKind1, invThreeOfKind1));
console.assert(!Game.compareHands(invThreeOfKind1, threeOfKind1));
// Straights
let cstraight1 = [8, 12, 16, 20, 27]; // 7 Spades high
let cstraight2 = [9, 13, 17, 21, 26]; // 7 Hearts high
let cstraight3 = [0, 5, 10, 14, 18]; // 2 Clubs high
let cstraight4 = [4, 11, 15, 19, 22]; // 2 Diamonds high
let cinv1 = [8, 13, 18, 24, 29] // 3 4 5 7 8, no flush
console.assert(!Game.compareHands(cstraight1, cstraight2));
console.assert(Game.compareHands(cstraight2, cstraight1));
console.assert(!Game.compareHands(cstraight3, cstraight4));
console.assert(Game.compareHands(cstraight4, cstraight3));
console.assert(Game.compareHands(cinv1, cstraight1));
console.assert(!Game.compareHands(cstraight1, cinv1));
// Flushes
let cflush1 = [8, 12, 16, 20, 28]; // 8 high
let cflush2 = [9, 13, 17, 21, 29]; // 8 high
let cflush3 = [6, 10, 14, 18, 26]; // 2 3 4 5 7
let cflush4 = [7, 11, 15, 19, 31]; // 2 3 4 5 8
console.assert(!Game.compareHands(cflush1, cflush2)); // Ties should be false
console.assert(!Game.compareHands(cflush2, cflush1));
console.assert(Game.compareHands(cflush1, cflush3));
console.assert(!Game.compareHands(cflush3, cflush1));
console.assert(Game.compareHands(cflush3, cflush4));
console.assert(!Game.compareHands(cflush4, cflush3));
console.assert(!Game.compareHands(cflush1, cstraight1)); // Flushes should beat straight
console.assert(Game.compareHands(cstraight1, cflush1));
console.assert(!Game.compareHands(cflush1, cstraight2));
console.assert(Game.compareHands(cstraight2, cflush1));
console.assert(Game.compareHands(cinv1, cflush1));
console.assert(!Game.compareHands(cflush1, cinv1));
// Full Houses
let cfullhouse1 = [8, 9, 10, 12, 13] // 3s
let cfullhouse2 = [8, 9, 12, 13, 14] // 4s
console.assert(Game.compareHands(cfullhouse1, cfullhouse2));
console.assert(!Game.compareHands(cfullhouse2, cfullhouse1));
console.assert(Game.compareHands(cstraight1, cfullhouse1));
console.assert(Game.compareHands(cflush1, cfullhouse1));
console.assert(Game.compareHands(cinv1, cfullhouse1));
console.assert(!Game.compareHands(cfullhouse1, cinv1));
// Four of a kinds
let cfourofkind1 = [8, 9, 10, 11, 12] // 3s
let cfourofkind2 = [8, 12, 13, 14, 15] // 4s
console.assert(Game.compareHands(cfourofkind1, cfourofkind2));
console.assert(!Game.compareHands(cfourofkind2, cfourofkind1));
console.assert(Game.compareHands(cstraight1, cfourofkind1));
console.assert(Game.compareHands(cflush1, cfourofkind1));
console.assert(Game.compareHands(cfullhouse1, cfourofkind1));
console.assert(Game.compareHands(cinv1, cfourofkind1));
console.assert(!Game.compareHands(cfourofkind1, cinv1));
// Straight flushes
let csf1 = [8, 12, 16, 20, 24] // 3 4 5 6 7, Diamonds
let csf2 = [1, 5, 9, 13, 17] // A 2 3 4 5, Clubs
let csf3 = [2, 6, 10, 14, 18] // A 2 3 4 5, Hearts
let csf4 = [7, 11, 15, 19, 23] // 2 3 4 5 6, Spades
console.assert(Game.compareHands(csf1, csf2));
console.assert(!Game.compareHands(csf2, csf1));
console.assert(Game.compareHands(csf2, csf3));
console.assert(!Game.compareHands(csf3, csf2));
console.assert(!Game.compareHands(csf3, csf1));
console.assert(Game.compareHands(csf3, csf4));
console.assert(Game.compareHands(cfourofkind1, csf1));
console.assert(Game.compareHands(cfullhouse1, csf1));
console.assert(Game.compareHands(cflush1, csf1));
console.assert(Game.compareHands(cstraight1, csf1));
console.assert(Game.compareHands(cinv1, csf1));
