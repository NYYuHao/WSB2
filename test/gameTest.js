const Game = require('../server/game.js');

const game = new Game();

let single1 = [8];
let single2 = [9];
let pair1 = [8, 9];
let pair2 = [10, 11];
let pair3 = [8, 11];
let invPair1 = [8, 12];
let threeOfKind1 = [8, 9, 10];
let threeOfKind2 = [12, 13, 14];
let invThreeOfKind1 = [8, 9, 12];
let flush1 = [8, 12, 16, 20, 24];
let invFlush1 = [8, 11, 16, 20, 24];
let straight1 = [9, 14, 19, 20, 27];
let straight2 = [8, 12, 16, 52, 56];
let straight3 = [8, 12, 16, 20, 56];
let straight4 = [36, 40, 44, 48, 53];
let invStraight1 = [40, 44, 48, 52, 56];
let fullHouse1 = [8, 9, 12, 13, 14];
let fullHouse2 = [8, 9, 10, 13, 14];
let fourOfKind1 = [8, 9, 10, 11, 14];

console.log("Testing pairs");
console.assert(Game.isPair(pair1), pair1);
console.assert(Game.isPair(pair2), pair2);
console.assert(Game.isPair(pair3), pair3);
console.assert(!Game.isPair(single1), single1);
console.assert(!Game.isPair(invPair1), invPair1);

console.log("Testing three of a kinds");
console.assert(Game.isThreeOfKind(threeOfKind1), threeOfKind1);
console.assert(Game.isThreeOfKind(threeOfKind2), threeOfKind2);
console.assert(!Game.isThreeOfKind(pair1), pair1);
console.assert(!Game.isThreeOfKind(single1), single1);
console.assert(!Game.isThreeOfKind(invThreeOfKind1), invThreeOfKind1);

console.log("Testing flushes");
console.assert(Game.isFlush(flush1), flush1);
console.assert(!Game.isFlush(invFlush1), invFlush1);

console.log("Testing straights");
console.assert(Game.isStraight(straight1), straight1);  // 3 4 5 6 7
console.assert(Game.isStraight(straight2), straight2);  // A 2 3 4 5
console.assert(Game.isStraight(straight3), straight3);  // 2 3 4 5 6
console.assert(Game.isStraight(straight4), straight4);  // 0 J Q K A
console.assert(!Game.isStraight(invStraight1), invStraight1); // J Q K A 2

console.log("Testing full houses");
console.assert(Game.isFullHouse(fullHouse1), fullHouse1);
console.assert(Game.isFullHouse(fullHouse2), fullHouse2);
console.assert(!Game.isFullHouse(fourOfKind1), fourOfKind1);

console.log("Testing four of a kinds");
console.assert(!Game.isFourOfKind(fullHouse1), fullHouse1);
console.assert(!Game.isFourOfKind(fullHouse2), fullHouse2);
console.assert(Game.isFourOfKind(fourOfKind1), fourOfKind1);

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
// Three of a Kinds
console.assert(Game.compareHands(threeOfKind1, threeOfKind2));
console.assert(!Game.compareHands(threeOfKind2, threeOfKind1));
