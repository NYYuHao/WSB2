const Game = require('../game.js');

const game = new Game();

let h1 = [0];
let h2 = [0, 1];
let h3 = [0, 1, 2];
let h4 = [0, 4, 8, 12, 16];
let h5 = [0, 3, 8, 12, 16];

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
