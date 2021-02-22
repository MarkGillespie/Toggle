import "https://unpkg.com/tiny-trie@0.2.6/dist/tiny-trie.min.js";
import "https://unpkg.com/tiny-trie@0.2.6/dist/packed-trie.min.js";

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

const dawg = new TinyTrie.PackedTrie(packed_lexicon);

let word_list = [];
function bfs(path, nodes, prefix = "") {
  const new_prefix = prefix + path[path.length - 1].letter;

  const first_match = dawg.search(new_prefix, { prefix: true, first: true });
  if (first_match !== null) {
    if (new_prefix === first_match) {
      word_list.push(new_prefix);
    }
    path[path.length - 1].neighbors.forEach((n) => {
      const [i, j] = n;
      if (!path.includes(nodes[i][j])) {
        bfs(path.concat([nodes[i][j]]), nodes, new_prefix);
      }
    });
  }
}

function find_all_words(board_letters, m, n) {
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < m; j++) {
      const node = { letter: board_letters[i * m + j], neighbors: [] };
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

  word_list = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      bfs([nodes[i][j]], nodes);
    }
  }
  return word_list;
}

export { find_all_words };
