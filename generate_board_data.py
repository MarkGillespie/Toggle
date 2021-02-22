import sys
import random
import dawg
import json

# random.seed(0)

# lexicon = 'collins_completion.dawg'
lexicon = 'NWL20.py.dawg'

class Node:
  def __init__(self):
    self.neighbors = []
    self.letter = ''

def get_letters(n,m):
  board = ''
  scrabble_distribution = ['A'] * 9 + ['B'] * 2 + ['C'] * 2 + ['D'] * 4 + ['E'] * 12 +['F'] * 2 + ['G'] * 3 + ['H'] * 2 + ['I'] * 9 + ['J'] * 1 + ['K'] * 1 + ['L'] * 4 + ['M'] * 2 + ['N'] * 6 + ['O'] * 8 + ['P'] * 2 + ['Q'] * 1 + ['R'] * 6 + ['S'] * 4 + ['T'] * 6 + ['U'] * 4 + ['V'] * 2 + ['W'] * 2 + ['X'] * 1 + ['Y'] * 2 + ['Z'] * 1

  # print("".join(scrabble_distribution))

  for _ in range(n * m):
    board += random.choice(scrabble_distribution)

  return board

def find_words(board, n, m):
  d = dawg.CompletionDAWG()
  d.load(lexicon)

  nodes = []
  for i in range(n):
    row = []
    for j in range(m):
      node = Node()
      node.letter = board[i * m + j]
      for dx in [-1,0,1]:
        for dy in [-1,0,1]:
          node.neighbors.append(((i+dy+n)%n, (j+dx+m)%m));
      row.append(node)
    nodes.append(row)

  found_words = set()
  for i in range(n):
    for j in range(m):
      found_words = found_words.union(bfs([nodes[i][j]], nodes, d))

  return found_words

def bfs(path, nodes, d, prefix=''):
  found_words = set()
  new_prefix = prefix + path[-1].letter
  if d.has_keys_with_prefix(new_prefix):
    if new_prefix in d:
      found_words.add(new_prefix)
    for (i, j) in path[-1].neighbors:
      if nodes[i][j] not in path:
        found_words = found_words.union(bfs(path + [nodes[i][j]], nodes, d, prefix=new_prefix))
  return found_words


if __name__ == '__main__':
  n = int(sys.argv[1])
  m = n
  board = get_letters(n, m)
  words = find_words(board, n, m)
  # print(json.dumps({board:board, words:list(words)}))
  print(json.dumps({
    'board':board,
    'words':list(words),
    'key':{'raw':board[0:min(n,4)], 'mnemonic':'TODO'},
    'm': m,
    'n': n}))

# code to generate collins_completion.dawg
# with open('collins.txt') as f:
#   contents = f.readlines()
# contents = [x.strip() for x in contents]
# d = dawg.CompletionDAWG(contents)
# d.save('collins_completion.dawg')
