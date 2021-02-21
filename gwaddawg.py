# Converts .dawg files from macondo/gaddag into .dawg files that the dawg python library can read

import sys
import dawg
pos = 0


 # NumArcsBitLoc is the bit location where the number of arcs start.
 # A Node has a number of arcs and a letterSet
NumArcsBitLoc = 24
LetterSetBitMask = (1 << NumArcsBitLoc) - 1

 # LetterBitLoc is the location where the letter starts.
 # An Arc has a letter and a next node.
LetterBitLoc = 24
NodeIdxBitMask = (1 << LetterBitLoc) - 1

def deserialize_node(serialized):
    num_arcs = serialized >> NumArcsBitLoc
    letter_set_id = serialized & LetterSetBitMask
    return num_arcs, letter_set_id

def deserialize_arc(serialized):
    letter_code = serialized >> LetterBitLoc
    destination = serialized & NodeIdxBitMask
    return letter_code, destination

def explore_tree(curr_node_idx, prefix, nodes, arcs, cap=10):
    if  curr_node_idx > len(nodes):
        return []
    node = nodes[curr_node_idx]
    words = [prefix + l for l in node['letter_set']]
    if cap > 0 and len(words)>cap:
        return words

    for iA in node['arcs']:
        arc = arcs[iA]
        new_prefix = prefix + arc['letter']
        words= words+(explore_tree(arc['dest'], new_prefix, nodes, arcs, cap - len(words)))
        if cap > 0 and len(words)>cap:
            return words

    return words



if __name__ == '__main__':
    infile = sys.argv[1]

    print(f"NumArcsBitLoc: {NumArcsBitLoc}")
    print(f"LetterSetBitMask: {LetterSetBitMask}")
    print(f"LetterBitLoc: {LetterBitLoc}")
    print(f"NodeIdxBitMask: {NodeIdxBitMask}")

    with open(infile, "rb") as f:
        data = f.read()
        print(f"data size: {len(data)}")

    def read_next(n):
        global pos
        start = pos
        end = pos + n
        pos = pos + n
        return data[start:end]

    magic_number = read_next(4).decode('UTF-8')
    print(f"magic_number: {magic_number}")

    lex_name_len = int.from_bytes(read_next(1), byteorder='big')
    print(f"lex_name_len: {lex_name_len}")

    lex_name = read_next(lex_name_len).decode('UTF-8')
    print(f"lex_name: {lex_name}")

    alphabet_size = int.from_bytes(read_next(4), byteorder='big')
    print(f"alphabet_size: {alphabet_size}")

    alphabet = read_next(4 * alphabet_size).decode('UTF-8')
    print(f"alphabet: {alphabet}")

    # for some reason alphabet is _ _ _ A _ _ _ B, etc
    # this trims out the blanks
    alphabet = alphabet[3::4]

    letter_set_size = int.from_bytes(read_next(4), byteorder='big')
    print(f"letter_set_size: {letter_set_size}")

    def set_letters(mask):
        ls = []
        for i in range(len(alphabet)):
            if mask&(1<<i) != 0:
                ls.append(alphabet[i])
        return ls

    letter_sets=[]
    letter_sets_blob = read_next(8*letter_set_size)
    for i in range(letter_set_size):
        set_bitmask = int.from_bytes(letter_sets_blob[8*i: 8*i+8], byteorder='big')
        letter_sets.append(set_letters(set_bitmask))
    # print(letter_set)

    nodes_size = int.from_bytes(read_next(4), byteorder='big')
    print(f"nodes_size: {nodes_size}")

    blob = read_next(4*nodes_size)
    print(f"final pos: {pos} of {len(data)}")

    nodes = []
    arcs = []


    pos = 0
    def read_arc():
        global pos
        serialized = int.from_bytes(blob[pos:pos+4], byteorder='big')
        pos += 4
        letter_code, destination = deserialize_arc(serialized)
        letter = alphabet[letter_code]
        arcs.append({'letter':letter, 'dest':destination})

    sparse_to_dense = {}
    def read_node():
        global pos
        global sparse_to_dense
        serialized = int.from_bytes(blob[pos:pos+4], byteorder='big')
        sparse_to_dense[int(pos / 4)] = len(nodes)
        pos += 4
        num_arcs, letter_set_id = deserialize_node(serialized)
        node = {'arcs':[], 'letter_set': letter_sets[letter_set_id]}
        for _ in range(num_arcs):
            node['arcs'].append(len(arcs))
            read_arc()
        nodes.append(node)
    read_node();
    while (pos < len(blob)):
        read_node()

    for arc in arcs:
        arc['dest'] = sparse_to_dense[arc['dest']]

    words = explore_tree(0, "", nodes, arcs, -1)
    # words.sort()
    # with open(infile + "_all.txt", "w") as f:
    #     f.write("\n".join(words))

    d = dawg.CompletionDAWG(words)
    d.save(infile+".py.dawg")
