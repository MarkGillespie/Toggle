import "https://unpkg.com/tiny-trie@0.2.6/dist/tiny-trie.min.js";
import { PackedPrefixTinyTrie } from "./fast_packed_trie.js";

//============================================================
//     construct a packed dawg from a list named "lexicon"
//============================================================
// console.log(lexicon);
// console.time("construt");
// const trie = TinyTrie.createSync(lexicon);
// console.timeEnd("construt");
// console.time("freeze");
// trie.freeze();
// console.timeEnd("freeze");
// console.time("encode");
// const encoded = trie.encode();
// console.timeEnd("encode");
// console.log(encoded);

//============================================================
//                 benchmark packed dawg
//============================================================
// console.time("Construct Packed Trie");
// const packed = new TinyTrie.PackedTrie(packed_lexicon);
// console.timeEnd("Construct Packed Trie");
// console.time("query-positive");
// console.log(packed.test("AVOCADO"));
// console.timeEnd("query-positive");
// console.time("query-negative");
// console.log(packed.test("AVOCADONT"));
// console.timeEnd("query-negative");
// console.time("query-prefix");
// console.log(packed.search("AVOC", { prefix: true }));
// console.timeEnd("query-prefix");

const dawg = new PackedPrefixTinyTrie(packed_lexicon);

let total_blowup = 0;
let n_items = 0;

let word_list = undefined;
function bfs(path, nodes, prefix = "") {
  const new_prefix = prefix + path[path.length - 1].letter;

  const query = dawg.search(new_prefix);
  if (query.prefix) {
    n_items += 1;
    if (query.inDict) {
      word_list.add(new_prefix);
    }
    path[path.length - 1].neighbors.forEach((n) => {
      const [i, j] = n;
      if (!path.includes(nodes[i][j])) {
        bfs(path.concat([nodes[i][j]]), nodes, new_prefix);
      }
    });
  }
}

function expandLetter(letter) {
  if (letter == "Q") {
    return "QU";
  } else {
    return letter;
  }
}

function find_all_words(board_letters, m, n) {
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < m; j++) {
      const node = {
        letter: expandLetter(board_letters[i * m + j]),
        neighbors: [],
      };
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx != 0 || dy != 0) {
            node.neighbors.push([(i + dy + n) % n, (j + dx + m) % m]);
          }
        }
      }
      row.push(node);
    }
    nodes.push(row);
  }

  word_list = new Set();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      bfs([nodes[i][j]], nodes);
    }
  }

  return [...word_list];
}

const match_nodes = { m: 0, n: 0, nodes: [] };
function generate_match_nodes(m, n) {
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < m; j++) {
      const node = {
        index: i * m + j,
        neighbors: [],
      };
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx != 0 || dy != 0) {
            node.neighbors.push([(i + dy + n) % n, (j + dx + m) % m]);
          }
        }
      }
      row.push(node);
    }
    match_nodes.nodes.push(row);
  }
  match_nodes.m = m;
  match_nodes.n = n;
}

function find_matches(board_letters, nodes, string, path) {
  if (board_letters.charAt(path[path.length - 1].index) == string.charAt(0)) {
    if (string.length == 1) {
      const indices = path.map((n) => n.index);
      return new Set(indices);
    }

    let matches = new Set();
    path[path.length - 1].neighbors.forEach((n) => {
      const [i, j] = n;
      if (!path.includes(nodes[i][j])) {
        const new_path = path.concat([nodes[i][j]]);
        const neighbor_matches = find_matches(
          board_letters,
          nodes,
          string.substring(1),
          new_path
        );
        if (neighbor_matches) {
          matches = new Set([...matches, ...neighbor_matches]);
        }
      }
    });
    return matches;
  } else {
    return null;
  }
}

function find_all_matches(board_letters, m, n, string) {
  if (match_nodes.m != m || match_nodes.n != n) {
    generate_match_nodes(m, n);
  }

  let highlighted_letters = new Set();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const new_matches = find_matches(
        board_letters,
        match_nodes.nodes,
        string,
        [match_nodes.nodes[i][j]]
      );
      if (new_matches) {
        highlighted_letters = new Set([...highlighted_letters, ...new_matches]);
      }
    }
  }

  return [...highlighted_letters];
}

export { find_all_words, find_all_matches };
