const Game = require('../server/game.js');

const game = new Game();

let h1 = [0];
let h2 = [0, 1];
let h3 = [0, 1, 2];
let h4 = [0, 4, 8, 12, 16];
let h5 = [0, 3, 8, 12, 16];
let h6 = [9, 14, 19, 20, 27];
let h7 = [8, 12, 16, 52, 56];
let h8 = [8, 12, 16, 20, 56];
let h9 = [36, 40, 44, 48, 53];
let h10 = [40, 44, 48, 52, 56];

console.log("Testing pairs");
console.assert(Game.isPair(h2), {hand: h2});
console.assert(!Game.isPair(h1), {hand: h1});

console.log("Testing three of a kinds");
console.assert(Game.isThreeOfKind(h3), {hand: h3});
console.assert(!Game.isThreeOfKind(h2), {hand: h2});
console.assert(!Game.isThreeOfKind(h1), {hand: h1});

console.log("Testing flushes");
console.assert(Game.isFlush(h4), {hand: h4});
console.assert(!Game.isFlush(h5), {hand: h5});

console.log("Testing straights");
console.assert(Game.isStraight(h6), {hand: h6});  // 3 4 5 6 7
console.assert(Game.isStraight(h7), {hand: h7});  // A 2 3 4 5
console.assert(Game.isStraight(h8), {hand: h8});  // 2 3 4 5 6
console.assert(Game.isStraight(h9), {hand: h9});  // 0 J Q K A
console.assert(!Game.isStraight(h10), {hand: h10}); // J Q K A 2
