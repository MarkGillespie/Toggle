import { drawBoard } from "./board.js";
import { find_all_words } from "./find_words.js";

let game_id = undefined;
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

const params = new URLSearchParams(window.location.search);
if (params.has("board")) game_id = params.get("board");
// console.log(params, params.get("board"));

function update_percentage() {
  document.getElementById("percentage").innerHTML =
    found_words.size.toString() + "/" + valid_words.length.toString();

  const isShort = (x) => x.length == 4 || x.length == 5;
  const isMed = (x) => x.length == 6 || x.length == 7;
  const isLong = (x) => x.length >= 8;

  // Detailed stats
  const short = [...found_words].filter(isShort).length;
  const totalShort = valid_words.filter(isShort).length;
  const med = [...found_words].filter(isMed).length;
  const totalMed = valid_words.filter(isMed).length;
  const long = [...found_words].filter(isLong).length;
  const totalLong = valid_words.filter(isLong).length;

  document.getElementById(
    "detailed-stats"
  ).innerHTML = `4-5 : ${short}/${totalShort}<br/> 6-7: ${med}/${totalMed} <br/> 8+: ${long}/ ${totalLong}`;
}

// TODO
function checkWordOkay(word) {
  return valid_words.includes(word.toUpperCase());
}

function standardize(word) {
  return word.replace(/[^a-zA-Z]/g, "").toUpperCase();
}

function addToWordList(word, style) {
  const el = document.createElement("span");
  el.innerHTML = standardize(word);
  el.classList.add(style);
  const wordList = document.getElementById("found-words");
  if (wordList.firstChild) {
    wordList.insertBefore(el, wordList.firstChild);
  } else {
    wordList.appendChild(el);
  }
  if (style == "good") {
    found_words.add(word.toUpperCase());
  }
  update_percentage();
}

document.getElementById("guess-word").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let style = "";
    const word = standardize(e.target.value);
    if (found_words.has(word)) {
      addToWordList(word, "repeated");
    } else if (checkWordOkay(word)) {
      addToWordList(word, "good");
      database
        .ref("boards")
        .child(game_id)
        .child("found_words")
        .set([...found_words]);
    } else {
      addToWordList(word, "bad");
    }

    e.target.value = "";
  }
});

// boardData should be a JSON object containing
// {
//  board: "LETTERS",
//  words: ["valid", words"],
//  key: {raw: "FOUR", menmonic: "Nice Words"},
//  m: m,
//  n: n
// }
function processNewBoard(boardData) {
  drawBoard(boardData["m"], boardData["n"], boardData["board"]);
  board_letters = boardData["board"];
  valid_words = boardData["words"]
    .filter((x) => x.length >= valid_word_length)
    .sort();
  console.log(valid_words);
  update_percentage();
}

function loadFoundWords(newWords) {
  found_words = new Set(newWords);
  let wordList = document.getElementById("found-words");
  wordList.innerHTML = "";
  found_words.forEach((word) => {
    addToWordList(word, "good");
  });
}

const scrabble_letters =
  "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ";

const boardSize = 10;
const base = "";
function newBoard() {
  document.getElementById("spinner").style.opacity = 1;
  const newBoardRef = database.ref("boards").push();

  const m = boardSize;
  const n = boardSize;
  let board = "";
  while (board.length < m * n) {
    board += scrabble_letters.charAt(Math.random() * scrabble_letters.length);
  }

  console.time("finding words");
  const words = find_all_words(board, m, n).sort();
  console.timeEnd("finding words");
  const boardData = {
    board: board,
    words: words,
    m: m,
    n: n,
    found_words: [],
    creation_time: firebase.database.ServerValue.TIMESTAMP,
  };

  newBoardRef.set(boardData);
  console.log(newBoardRef.key);
  game_id = newBoardRef.key;

  // TODO sync new board with firebase
  processNewBoard(boardData);

  // https://developer.mozilla.org/en-US/docs/Web/API/History_API#Adding_and_modifying_history_entries
  // What is page : 1 ???? and title 1 ????
  history.pushState({ page: 1 }, "title 1", `?board=${game_id}`);
  document.getElementById("spinner").style.opacity = 0;
}

document.getElementById("new-board").onclick = newBoard;

function fetchBoard() {
  // database
  //   .ref("boards")
  //   .once("value")
  //   .then((s) => {
  //     console.log(s.toJSON());
  //   });

  if (game_id) {
    const boardRef = database.ref("boards").child(game_id);
    boardRef.once("value").then(function (snapshot) {
      let data = snapshot.toJSON();
      data.words = Object.values(data.words);
      processNewBoard(data);
      if (data.found_words) loadFoundWords(Object.values(data.found_words));
      document.getElementById("spinner").style.opacity = 0;
    });
    boardRef.child("found_words").on("child_added", function (snapshot) {
      let word = snapshot.toJSON();
      if (!found_words.has(word)) {
        addToWordList(snapshot.toJSON(), "good");
      }
    });
  } else {
    const boardRef = database
      .ref("boards")
      .orderByChild("creation_time")
      .limitToLast(1);

    boardRef.once("value").then(function (snapshot) {
      const snapJSON = snapshot.toJSON();
      game_id = Object.keys(snapJSON)[0];
      console.log(game_id);
      let data = Object.values(snapJSON)[0];
      data.words = Object.values(data.words);
      processNewBoard(data);
      if (data.found_words) loadFoundWords(Object.values(data.found_words));

      // https://developer.mozilla.org/en-US/docs/Web/API/History_API#Adding_and_modifying_history_entries
      // What is page : 1 ???? and title 1 ????
      history.pushState({ page: 1 }, "title 1", `?board=${game_id}`);
      document.getElementById("spinner").style.display = "none";
    });
    boardRef.ref.child("found_words").on("child_added", function (snapshot) {
      let word = snapshot.toJSON();
      if (!found_words.has(word)) {
        addToWordList(snapshot.toJSON(), "good");
      }
    });
  }
}

if (windowLoaded) {
  fetchBoard();
} else {
  window.onload = fetchBoard();
}
