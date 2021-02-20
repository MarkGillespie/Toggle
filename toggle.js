import { drawBoard } from "./board.js";

let board_letters = "";
while (board_letters.length < 100) {
  board_letters += Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "");
}
drawBoard(10, 10, board_letters);
