import { drawBoard } from "./board.js";

let board_letters = "";
while (board_letters.length < 100) {
  board_letters += Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "");
}
drawBoard(10, 10, board_letters);

// TODO
function checkWordOkay(word) {
  return word.length > 4;
}

function addToWordList(word, isOkay) {
  const el = document.createElement("span");
  el.innerHTML = word;
  el.classList.add(isOkay ? "good" : "bad");
  const wordList = document.getElementById("found-words");
  if (wordList.firstChild) {
    wordList.insertBefore(el, wordList.firstChild);
  } else {
    wordList.appendChild(el);
  }
}

document.getElementById("guess-word").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const word = e.target.value;
    addToWordList(word, checkWordOkay(word));
    e.target.value = "";
  }
});
