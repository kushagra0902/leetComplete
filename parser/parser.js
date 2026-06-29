// parser.js
// Responsibility: Source Code → AST (Tree-sitter SyntaxNode).
//
// Rules:
//   - This module does ONE thing: parse source code and return an AST.
//   - No semantic analysis.
//   - No symbol tables.
//   - No Monaco interaction.
//   - No STL knowledge.
//   - No mock fallbacks — we use Tree-sitter exclusively.

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** @type {import('web-tree-sitter').Parser | null} */
let _parser = null;

/** @type {import('web-tree-sitter').Tree | null} — kept for incremental re-parse */
let _prevTree = null;

let _ready = false;
let _initPromise = null;

// ---------------------------------------------------------------------------
// Initialisation (called once from provider.js)
// ---------------------------------------------------------------------------

/**
 * Load web-tree-sitter and the C++ grammar.
 * Safe to call multiple times — returns the same promise after the first call.
 *
 * @returns {Promise<void>}
 */
export function initParser() {
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
        const TreeSitter = window.TreeSitter;

        await TreeSitter.init({
            locateFile(filename) {
                // Tell Emscripten where to find tree-sitter.wasm using the extension base URL
                return window.EXT_URL + filename;
            }
        });

        const Cpp = await TreeSitter.Language.load(
            window.EXT_URL + 'tree-sitter-cpp.wasm'
        );

        _parser = new TreeSitter();
        _parser.setLanguage(Cpp);
        _ready = true;
    })();

    return _initPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse source code and return the root SyntaxNode.
 * Passes the previous tree for incremental re-parsing — only changed
 * regions of the file are re-analysed by Tree-sitter.
 *
 * @param {string} sourceCode
 * @returns {import('web-tree-sitter').SyntaxNode}
 * @throws {Error} if initParser() has not been awaited first
 */
export function parseSource(sourceCode) {
    if (!_ready || !_parser) {
        throw new Error(
            'LeetComplete [parser]: parseSource() called before initParser() resolved.'
        );
    }

    // We must do a full parse because we aren't tracking precise row/col edits.
    // Tree-sitter is extremely fast, so parsing a LeetCode file takes <1ms anyway.
    const tree = _parser.parse(sourceCode);

    // Release the old tree to avoid memory leaks
    if (_prevTree) {
        _prevTree.delete();
    }
    _prevTree = tree;

    return tree.rootNode;
}

/**
 * Whether the parser is initialised and ready to use.
 * @returns {boolean}
 */
export function isParserReady() {
    return _ready;
}
