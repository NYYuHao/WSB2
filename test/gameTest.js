const Game = require('../server/game.js');

const game = new Game();

let h1 = [0];
let h2 = [0, 1];
let h3 = [0, 1, 2];
let h4 = [0, 4, 8, 12, 16];     // Flushes
let h5 = [0, 3, 8, 12, 16];
let h6 = [9, 14, 19, 20, 27];   // Straights
let h7 = [8, 12, 16, 52, 56];
let h8 = [8, 12, 16, 20, 56];
let h9 = [36, 40, 44, 48, 53];
let h10 = [40, 44, 48, 52, 56];
let h11 = [8, 9, 12, 13, 14];   // Full houses / Four of a Kinds
let h12 = [8, 9, 10, 13, 14];
let h13 = [8, 9, 10, 11, 14];

console.log("Testing pairs");
console.assert(Game.isPair(h2), h2);
console.assert(!Game.isPair(h1), h1);

console.log("Testing three of a kinds");
console.assert(Game.isThreeOfKind(h3), h3);
console.assert(!Game.isThreeOfKind(h2), h2);
console.assert(!Game.isThreeOfKind(h1), h1);

console.log("Testing flushes");
console.assert(Game.isFlush(h4), h4);
console.assert(!Game.isFlush(h5), h5);

console.log("Testing straights");
console.assert(Game.isStraight(h6), h6);  // 3 4 5 6 7
console.assert(Game.isStraight(h7), h7);  // A 2 3 4 5
console.assert(Game.isStraight(h8), h8);  // 2 3 4 5 6
console.assert(Game.isStraight(h9), h9);  // 0 J Q K A
console.assert(!Game.isStraight(h10), h10); // J Q K A 2

console.log("Testing full houses");
console.assert(Game.isFullHouse(h11), h11);
console.assert(Game.isFullHouse(h12), h12);
console.assert(!Game.isFullHouse(h13), h13);

console.log("Testing four of a kinds");
console.assert(!Game.isFourOfKind(h11), h11);
console.assert(!Game.isFourOfKind(h12), h12);
console.assert(Game.isFourOfKind(h13), h13);
