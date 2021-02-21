import { drawBoard } from "./board.js";

let board_letters = "";
let valid_words = [];
let found_words = new Set();
const valid_word_length = 4;

// while (board_letters.length < 100) {
//   board_letters += Math.random()
//     .toString(36)
//     .replace(/[^a-z]+/g, "");
// }
// drawBoard(10, 10, board_letters);


function update_percentage() {
  document.getElementById('percentage').innerHTML = found_words.size.toString() + "/" + valid_words.length.toString();
}

// TODO
function checkWordOkay(word) {
  if (valid_words.includes(word.toUpperCase())) {
    found_words.add(word.toUpperCase());
    update_percentage();
    return true;
  }
}

function addToWordList(word, style) {
  const el = document.createElement("span");
  el.innerHTML = word;
  el.classList.add(style);
  const wordList = document.getElementById("found-words");
  if (wordList.firstChild) {
    wordList.insertBefore(el, wordList.firstChild);
  } else {
    wordList.appendChild(el);
  }
}

document.getElementById("guess-word").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let style = '';
    const word = e.target.value.toUpperCase();
    if (found_words.has(word)) {
      style = 'repeated';
    } else if (checkWordOkay(word)) {
      style = 'good';
    } else {
      style = 'bad';
    }

    addToWordList(word, style);
    e.target.value = "";
  }
});

const base = "";
function newBoard() {
  let xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    console.log(this.response);
    // boardData = JSON.parse(this.response);
    // render();
    // document.getElementById("Spinner").style.display = "none";
  };
  xhttp.open("POST", base + "NewBoard.php", true);
  let params = "board=" + board_letters;
  //Send the proper header information along with the request
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(params);
  // document.getElementById("Spinner").style.display = "inline-block";
}

document.getElementById("new-board").onclick = newBoard;

function fetchBoard() {
  let xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    console.log(this.response);
    let boardData = JSON.parse(this.response);
    drawBoard(boardData['m'], boardData['n'], boardData['board']);
    board_letters = boardData['board'];
    valid_words = boardData['words'].filter(x => (x.length >= valid_word_length)).sort();
    update_percentage();
    console.log(valid_words);
  };
  xhttp.open("GET", base + "NewBoard.php", true);
  xhttp.send();
  // document.getElementById("Spinner").style.display = "inline-block";
}

document.getElementById("fetch-board").onclick = fetchBoard;

fetchBoard();







