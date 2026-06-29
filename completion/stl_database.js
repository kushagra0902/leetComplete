// stl_database.js
// Pure lookup table: base type → { methods, constructors, templateParameters }.
// No parsing. No semantic analysis. No completion logic.
// Returns empty arrays for unknown types — callers must handle that gracefully.

/**
 * @typedef {Object} STLMethod
 * @property {string} name
 * @property {string} signature      — human-readable signature
 * @property {string} [doc]          — one-line description
 */

/**
 * @typedef {Object} STLTypeInfo
 * @property {STLMethod[]} methods
 * @property {string[]}    templateParameters   — e.g. ["T", "Container", "Compare"]
 * @property {string}      [header]             — e.g. "<queue>"
 */

/** @type {Map<string, STLTypeInfo>} */
const _db = new Map([

    // ------------------------------------------------------------------
    // <queue>
    // ------------------------------------------------------------------
    ['priority_queue', {
        header: '<queue>',
        templateParameters: ['T', 'Container', 'Compare'],
        methods: [
            { name: 'push',  signature: 'void push(const T& value)',    doc: 'Insert element' },
            { name: 'pop',   signature: 'void pop()',                   doc: 'Remove top element' },
            { name: 'top',   signature: 'const T& top() const',         doc: 'Access top element' },
            { name: 'empty', signature: 'bool empty() const',           doc: 'Check if empty' },
            { name: 'size',  signature: 'size_type size() const',       doc: 'Return element count' },
        ],
    }],
    ['queue', {
        header: '<queue>',
        templateParameters: ['T'],
        methods: [
            { name: 'push',  signature: 'void push(const T& value)',    doc: 'Insert element at back' },
            { name: 'pop',   signature: 'void pop()',                   doc: 'Remove front element' },
            { name: 'front', signature: 'T& front()',                   doc: 'Access front element' },
            { name: 'back',  signature: 'T& back()',                    doc: 'Access back element' },
            { name: 'empty', signature: 'bool empty() const',           doc: 'Check if empty' },
            { name: 'size',  signature: 'size_type size() const',       doc: 'Return element count' },
        ],
    }],

    // ------------------------------------------------------------------
    // <stack>
    // ------------------------------------------------------------------
    ['stack', {
        header: '<stack>',
        templateParameters: ['T'],
        methods: [
            { name: 'push',  signature: 'void push(const T& value)',    doc: 'Push element' },
            { name: 'pop',   signature: 'void pop()',                   doc: 'Remove top element' },
            { name: 'top',   signature: 'T& top()',                     doc: 'Access top element' },
            { name: 'empty', signature: 'bool empty() const',           doc: 'Check if empty' },
            { name: 'size',  signature: 'size_type size() const',       doc: 'Return element count' },
        ],
    }],

    // ------------------------------------------------------------------
    // <vector>
    // ------------------------------------------------------------------
    ['vector', {
        header: '<vector>',
        templateParameters: ['T'],
        methods: [
            { name: 'push_back',  signature: 'void push_back(const T& value)',          doc: 'Add element at end' },
            { name: 'pop_back',   signature: 'void pop_back()',                          doc: 'Remove last element' },
            { name: 'emplace_back', signature: 'T& emplace_back(Args&&... args)',        doc: 'Construct element at end' },
            { name: 'front',      signature: 'T& front()',                               doc: 'Access first element' },
            { name: 'back',       signature: 'T& back()',                                doc: 'Access last element' },
            { name: 'at',         signature: 'T& at(size_type pos)',                     doc: 'Access element with bounds check' },
            { name: 'size',       signature: 'size_type size() const',                   doc: 'Return element count' },
            { name: 'empty',      signature: 'bool empty() const',                       doc: 'Check if empty' },
            { name: 'clear',      signature: 'void clear()',                             doc: 'Clear contents' },
            { name: 'resize',     signature: 'void resize(size_type count)',             doc: 'Change element count' },
            { name: 'reserve',    signature: 'void reserve(size_type new_cap)',          doc: 'Reserve storage' },
            { name: 'begin',      signature: 'iterator begin()',                         doc: 'Iterator to beginning' },
            { name: 'end',        signature: 'iterator end()',                           doc: 'Iterator to end' },
            { name: 'rbegin',     signature: 'reverse_iterator rbegin()',                doc: 'Reverse iterator to beginning' },
            { name: 'rend',       signature: 'reverse_iterator rend()',                  doc: 'Reverse iterator to end' },
            { name: 'erase',      signature: 'iterator erase(iterator pos)',             doc: 'Erase elements' },
            { name: 'insert',     signature: 'iterator insert(iterator pos, const T&)', doc: 'Insert elements' },
            { name: 'assign',     signature: 'void assign(size_type n, const T& val)',  doc: 'Assign content' },
        ],
    }],

    // ------------------------------------------------------------------
    // <deque>
    // ------------------------------------------------------------------
    ['deque', {
        header: '<deque>',
        templateParameters: ['T'],
        methods: [
            { name: 'push_back',  signature: 'void push_back(const T& value)',   doc: 'Add element at end' },
            { name: 'push_front', signature: 'void push_front(const T& value)',  doc: 'Add element at front' },
            { name: 'pop_back',   signature: 'void pop_back()',                  doc: 'Remove last element' },
            { name: 'pop_front',  signature: 'void pop_front()',                 doc: 'Remove first element' },
            { name: 'front',      signature: 'T& front()',                       doc: 'Access first element' },
            { name: 'back',       signature: 'T& back()',                        doc: 'Access last element' },
            { name: 'size',       signature: 'size_type size() const',           doc: 'Return element count' },
            { name: 'empty',      signature: 'bool empty() const',               doc: 'Check if empty' },
        ],
    }],

    // ------------------------------------------------------------------
    // <map>
    // ------------------------------------------------------------------
    ['map', {
        header: '<map>',
        templateParameters: ['Key', 'Value'],
        methods: [
            { name: 'insert',      signature: 'pair<iterator,bool> insert(const value_type&)', doc: 'Insert element' },
            { name: 'erase',       signature: 'size_type erase(const key_type& k)',            doc: 'Erase by key' },
            { name: 'find',        signature: 'iterator find(const key_type& k)',              doc: 'Find element' },
            { name: 'count',       signature: 'size_type count(const key_type& k) const',     doc: 'Count elements with key' },
            { name: 'at',          signature: 'mapped_type& at(const key_type& k)',            doc: 'Access with bounds check' },
            { name: 'size',        signature: 'size_type size() const',                        doc: 'Return element count' },
            { name: 'empty',       signature: 'bool empty() const',                            doc: 'Check if empty' },
            { name: 'clear',       signature: 'void clear()',                                  doc: 'Clear contents' },
            { name: 'begin',       signature: 'iterator begin()',                               doc: 'Iterator to beginning' },
            { name: 'end',         signature: 'iterator end()',                                 doc: 'Iterator to end' },
            { name: 'lower_bound', signature: 'iterator lower_bound(const key_type& k)',       doc: 'First not-less element' },
            { name: 'upper_bound', signature: 'iterator upper_bound(const key_type& k)',       doc: 'First greater element' },
        ],
    }],

    // ------------------------------------------------------------------
    // <unordered_map>
    // ------------------------------------------------------------------
    ['unordered_map', {
        header: '<unordered_map>',
        templateParameters: ['Key', 'Value'],
        methods: [
            { name: 'insert',  signature: 'pair<iterator,bool> insert(const value_type&)', doc: 'Insert element' },
            { name: 'erase',   signature: 'size_type erase(const key_type& k)',            doc: 'Erase by key' },
            { name: 'find',    signature: 'iterator find(const key_type& k)',              doc: 'Find element' },
            { name: 'count',   signature: 'size_type count(const key_type& k) const',     doc: 'Count elements with key' },
            { name: 'at',      signature: 'mapped_type& at(const key_type& k)',            doc: 'Access with bounds check' },
            { name: 'size',    signature: 'size_type size() const',                        doc: 'Return element count' },
            { name: 'empty',   signature: 'bool empty() const',                            doc: 'Check if empty' },
            { name: 'clear',   signature: 'void clear()',                                  doc: 'Clear contents' },
            { name: 'begin',   signature: 'iterator begin()',                               doc: 'Iterator to beginning' },
            { name: 'end',     signature: 'iterator end()',                                 doc: 'Iterator to end' },
        ],
    }],

    // ------------------------------------------------------------------
    // <set>
    // ------------------------------------------------------------------
    ['set', {
        header: '<set>',
        templateParameters: ['Key'],
        methods: [
            { name: 'insert',      signature: 'pair<iterator,bool> insert(const value_type&)', doc: 'Insert element' },
            { name: 'erase',       signature: 'size_type erase(const key_type& k)',            doc: 'Erase by key' },
            { name: 'find',        signature: 'iterator find(const key_type& k)',              doc: 'Find element' },
            { name: 'count',       signature: 'size_type count(const key_type& k) const',     doc: 'Count occurrences' },
            { name: 'size',        signature: 'size_type size() const',                        doc: 'Return element count' },
            { name: 'empty',       signature: 'bool empty() const',                            doc: 'Check if empty' },
            { name: 'clear',       signature: 'void clear()',                                  doc: 'Clear contents' },
            { name: 'begin',       signature: 'iterator begin()',                               doc: 'Iterator to beginning' },
            { name: 'end',         signature: 'iterator end()',                                 doc: 'Iterator to end' },
            { name: 'lower_bound', signature: 'iterator lower_bound(const key_type& k)',       doc: 'First not-less element' },
            { name: 'upper_bound', signature: 'iterator upper_bound(const key_type& k)',       doc: 'First greater element' },
        ],
    }],

    // ------------------------------------------------------------------
    // <unordered_set>
    // ------------------------------------------------------------------
    ['unordered_set', {
        header: '<unordered_set>',
        templateParameters: ['Key'],
        methods: [
            { name: 'insert', signature: 'pair<iterator,bool> insert(const value_type&)', doc: 'Insert element' },
            { name: 'erase',  signature: 'size_type erase(const key_type& k)',            doc: 'Erase by key' },
            { name: 'find',   signature: 'iterator find(const key_type& k)',              doc: 'Find element' },
            { name: 'count',  signature: 'size_type count(const key_type& k) const',     doc: 'Count occurrences' },
            { name: 'size',   signature: 'size_type size() const',                        doc: 'Return element count' },
            { name: 'empty',  signature: 'bool empty() const',                            doc: 'Check if empty' },
            { name: 'clear',  signature: 'void clear()',                                  doc: 'Clear contents' },
        ],
    }],

    // ------------------------------------------------------------------
    // <string>
    // ------------------------------------------------------------------
    ['string', {
        header: '<string>',
        templateParameters: [],
        methods: [
            { name: 'length',   signature: 'size_type length() const',                        doc: 'Return string length' },
            { name: 'size',     signature: 'size_type size() const',                           doc: 'Return string size' },
            { name: 'empty',    signature: 'bool empty() const',                               doc: 'Check if empty' },
            { name: 'clear',    signature: 'void clear()',                                     doc: 'Clear string' },
            { name: 'substr',   signature: 'string substr(size_type pos=0, size_type len=npos) const', doc: 'Get substring' },
            { name: 'find',     signature: 'size_type find(const string& str, size_type pos=0) const', doc: 'Find substring' },
            { name: 'push_back',signature: 'void push_back(char c)',                           doc: 'Append character' },
            { name: 'pop_back', signature: 'void pop_back()',                                  doc: 'Remove last character' },
            { name: 'append',   signature: 'string& append(const string& str)',                doc: 'Append string' },
            { name: 'begin',    signature: 'iterator begin()',                                 doc: 'Iterator to beginning' },
            { name: 'end',      signature: 'iterator end()',                                   doc: 'Iterator to end' },
            { name: 'c_str',    signature: 'const char* c_str() const',                       doc: 'Get C-string' },
            { name: 'at',       signature: 'char& at(size_type pos)',                          doc: 'Access with bounds check' },
            { name: 'erase',    signature: 'iterator erase(iterator pos)',                     doc: 'Erase characters' },
            { name: 'insert',   signature: 'string& insert(size_type pos, const string& str)',doc: 'Insert characters' },
            { name: 'replace',  signature: 'string& replace(size_type pos, size_type len, const string& str)', doc: 'Replace part of string' },
            { name: 'compare',  signature: 'int compare(const string& str) const',            doc: 'Compare strings' },
        ],
    }],

    // ------------------------------------------------------------------
    // pair (header <utility>)
    // ------------------------------------------------------------------
    ['pair', {
        header: '<utility>',
        templateParameters: ['T1', 'T2'],
        methods: [
            { name: 'first',  signature: 'T1 first',  doc: 'First element (member, not method)' },
            { name: 'second', signature: 'T2 second', doc: 'Second element (member, not method)' },
        ],
    }],

]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @param {string} baseType   — e.g. "priority_queue", "vector"
 * @returns {STLTypeInfo|null}
 */
export function getSTLTypeInfo(baseType) {
    return _db.get(baseType) || null;
}

/**
 * @param {string} baseType
 * @returns {STLMethod[]}
 */
export function getSTLMethods(baseType) {
    const info = _db.get(baseType);
    return info ? info.methods : [];
}

/**
 * Filter methods by prefix (case-insensitive prefix match).
 *
 * @param {string} baseType
 * @param {string} prefix
 * @returns {STLMethod[]}
 */
export function getSTLMethodsFiltered(baseType, prefix) {
    const methods = getSTLMethods(baseType);
    if (!prefix) return methods;
    const lp = prefix.toLowerCase();
    return methods.filter(m => m.name.toLowerCase().startsWith(lp));
}
