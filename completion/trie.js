// trie.js
// A compressed Trie for O(prefix-length) prefix lookups.
// Seeded with STL types, keywords, and common C++ idioms.
// Completely independent of ProgramState and Tree-sitter.

// ---------------------------------------------------------------------------
// Trie node
// ---------------------------------------------------------------------------

class TrieNode {
    constructor() {
        /** @type {Map<string, TrieNode>} */
        this.children = new Map();
        /** @type {TrieEntry | null} */
        this.entry = null;
    }
}

// ---------------------------------------------------------------------------
// Trie
// ---------------------------------------------------------------------------

export class Trie {
    constructor() {
        this._root = new TrieNode();
    }

    /**
     * Insert a word with associated metadata.
     * @param {string} word
     * @param {TrieEntry} entry
     */
    insert(word, entry) {
        let node = this._root;
        for (const ch of word.toLowerCase()) {
            if (!node.children.has(ch)) {
                node.children.set(ch, new TrieNode());
            }
            node = node.children.get(ch);
        }
        node.entry = entry;
    }

    /**
     * Return all entries whose key starts with `prefix`.
     * Results are capped at `limit` (default 20) to keep the popup snappy.
     *
     * @param {string} prefix
     * @param {number} [limit=20]
     * @returns {TrieEntry[]}
     */
    search(prefix, limit = 20) {
        let node = this._root;
        for (const ch of prefix.toLowerCase()) {
            if (!node.children.has(ch)) return [];
            node = node.children.get(ch);
        }
        const results = [];
        this._collect(node, results, limit);
        return results;
    }

    /** DFS collect all entries under a subtree */
    _collect(node, results, limit) {
        if (results.length >= limit) return;
        if (node.entry) results.push(node.entry);
        for (const child of node.children.values()) {
            if (results.length >= limit) break;
            this._collect(child, results, limit);
        }
    }
}

// ---------------------------------------------------------------------------
// TrieEntry typedef
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TrieEntry
 * @property {string} label
 * @property {'Keyword'|'Class'|'Function'|'Snippet'} kind
 * @property {string} detail
 * @property {string} insertText
 * @property {string} sortText
 */

// ---------------------------------------------------------------------------
// Seed data — STL containers, algorithms, keywords, common patterns
// ---------------------------------------------------------------------------

const SEED_WORDS = [
    // -- Containers --
    { label: 'vector',          kind: 'Class',   detail: '<vector>',        insertText: 'vector<${1:T}> ${2:v};' },
    { label: 'string',          kind: 'Class',   detail: '<string>',        insertText: 'string' },
    { label: 'stack',           kind: 'Class',   detail: '<stack>',         insertText: 'stack<${1:T}> ${2:st};' },
    { label: 'queue',           kind: 'Class',   detail: '<queue>',         insertText: 'queue<${1:T}> ${2:q};' },
    { label: 'deque',           kind: 'Class',   detail: '<deque>',         insertText: 'deque<${1:T}> ${2:dq};' },
    { label: 'priority_queue',  kind: 'Class',   detail: '<queue>',         insertText: 'priority_queue<${1:T}> ${2:pq};' },
    { label: 'map',             kind: 'Class',   detail: '<map>',           insertText: 'map<${1:K}, ${2:V}> ${3:mp};' },
    { label: 'unordered_map',   kind: 'Class',   detail: '<unordered_map>', insertText: 'unordered_map<${1:K}, ${2:V}> ${3:mp};' },
    { label: 'set',             kind: 'Class',   detail: '<set>',           insertText: 'set<${1:T}> ${2:st};' },
    { label: 'unordered_set',   kind: 'Class',   detail: '<unordered_set>', insertText: 'unordered_set<${1:T}> ${2:us};' },
    { label: 'multiset',        kind: 'Class',   detail: '<set>',           insertText: 'multiset<${1:T}> ${2:ms};' },
    { label: 'multimap',        kind: 'Class',   detail: '<map>',           insertText: 'multimap<${1:K}, ${2:V}> ${3:mm};' },
    { label: 'pair',            kind: 'Class',   detail: '<utility>',       insertText: 'pair<${1:T1}, ${2:T2}>'},
    { label: 'array',           kind: 'Class',   detail: '<array>',         insertText: 'array<${1:T}, ${2:N}> ${3:arr};' },
    { label: 'list',            kind: 'Class',   detail: '<list>',          insertText: 'list<${1:T}> ${2:ls};' },

    // -- Algorithms --
    { label: 'sort',            kind: 'Function', detail: '<algorithm>',    insertText: 'sort(${1:begin}, ${2:end});' },
    { label: 'reverse',         kind: 'Function', detail: '<algorithm>',    insertText: 'reverse(${1:begin}, ${2:end});' },
    { label: 'find',            kind: 'Function', detail: '<algorithm>',    insertText: 'find(${1:begin}, ${2:end}, ${3:val})' },
    { label: 'binary_search',   kind: 'Function', detail: '<algorithm>',    insertText: 'binary_search(${1:begin}, ${2:end}, ${3:val})' },
    { label: 'lower_bound',     kind: 'Function', detail: '<algorithm>',    insertText: 'lower_bound(${1:begin}, ${2:end}, ${3:val})' },
    { label: 'upper_bound',     kind: 'Function', detail: '<algorithm>',    insertText: 'upper_bound(${1:begin}, ${2:end}, ${3:val})' },
    { label: 'max_element',     kind: 'Function', detail: '<algorithm>',    insertText: 'max_element(${1:begin}, ${2:end})' },
    { label: 'min_element',     kind: 'Function', detail: '<algorithm>',    insertText: 'min_element(${1:begin}, ${2:end})' },
    { label: 'accumulate',      kind: 'Function', detail: '<numeric>',      insertText: 'accumulate(${1:begin}, ${2:end}, ${3:0})' },
    { label: 'fill',            kind: 'Function', detail: '<algorithm>',    insertText: 'fill(${1:begin}, ${2:end}, ${3:val});' },
    { label: 'count',           kind: 'Function', detail: '<algorithm>',    insertText: 'count(${1:begin}, ${2:end}, ${3:val})' },
    { label: 'unique',          kind: 'Function', detail: '<algorithm>',    insertText: 'unique(${1:begin}, ${2:end})' },
    { label: 'next_permutation',kind: 'Function', detail: '<algorithm>',    insertText: 'next_permutation(${1:begin}, ${2:end})' },
    { label: 'make_pair',       kind: 'Function', detail: '<utility>',      insertText: 'make_pair(${1:first}, ${2:second})' },
    { label: 'make_heap',       kind: 'Function', detail: '<algorithm>',    insertText: 'make_heap(${1:begin}, ${2:end});' },
    { label: 'abs',             kind: 'Function', detail: '<cstdlib>',      insertText: 'abs(${1:n})' },
    { label: 'max',             kind: 'Function', detail: '<algorithm>',    insertText: 'max(${1:a}, ${2:b})' },
    { label: 'min',             kind: 'Function', detail: '<algorithm>',    insertText: 'min(${1:a}, ${2:b})' },
    { label: 'swap',            kind: 'Function', detail: '<utility>',      insertText: 'swap(${1:a}, ${2:b});' },
    { label: 'stoi',            kind: 'Function', detail: '<string>',       insertText: 'stoi(${1:str})' },
    { label: 'stoll',           kind: 'Function', detail: '<string>',       insertText: 'stoll(${1:str})' },
    { label: 'to_string',       kind: 'Function', detail: '<string>',       insertText: 'to_string(${1:n})' },

    // -- Primitive types --
    { label: 'int',             kind: 'Keyword', detail: 'type', insertText: 'int' },
    { label: 'long',            kind: 'Keyword', detail: 'type', insertText: 'long' },
    { label: 'bool',            kind: 'Keyword', detail: 'type', insertText: 'bool' },
    { label: 'char',            kind: 'Keyword', detail: 'type', insertText: 'char' },
    { label: 'float',           kind: 'Keyword', detail: 'type', insertText: 'float' },
    { label: 'double',          kind: 'Keyword', detail: 'type', insertText: 'double' },
    { label: 'auto',            kind: 'Keyword', detail: 'keyword', insertText: 'auto' },
    { label: 'const',           kind: 'Keyword', detail: 'keyword', insertText: 'const' },
    { label: 'return',          kind: 'Keyword', detail: 'keyword', insertText: 'return ' },
    { label: 'nullptr',         kind: 'Keyword', detail: 'keyword', insertText: 'nullptr' },
    { label: 'INT_MAX',         kind: 'Keyword', detail: '<climits>', insertText: 'INT_MAX' },
    { label: 'INT_MIN',         kind: 'Keyword', detail: '<climits>', insertText: 'INT_MIN' },
    { label: 'LLONG_MAX',       kind: 'Keyword', detail: '<climits>', insertText: 'LLONG_MAX' },

    // -- Common patterns / snippets --
    { label: 'for',  kind: 'Snippet', detail: 'range-for loop',  insertText: 'for (auto& ${1:x} : ${2:container}) {\n\t$0\n}' },
    { label: 'fore', kind: 'Snippet', detail: 'index-for loop',  insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}' },
    { label: 'while',kind: 'Snippet', detail: 'while loop',      insertText: 'while (${1:condition}) {\n\t$0\n}' },
    { label: 'if',   kind: 'Snippet', detail: 'if statement',    insertText: 'if (${1:condition}) {\n\t$0\n}' },
];

// ---------------------------------------------------------------------------
// Build and export the singleton trie
// ---------------------------------------------------------------------------

export const globalTrie = new Trie();

for (const w of SEED_WORDS) {
    globalTrie.insert(w.label, {
        label:      w.label,
        kind:       w.kind,
        detail:     w.detail,
        insertText: w.insertText ?? w.label,
        sortText:   '9' + w.label, // sorts after semantic suggestions
    });
}
