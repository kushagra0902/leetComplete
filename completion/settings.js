// settings.js
// Shared singleton for user-controlled completion mode.
// Persisted to localStorage so preference survives page refreshes.

const STORAGE_KEY = 'leetcomplete_mode';

// Valid modes:
//  'semantic' — only trigger-character suggestions (., ->, ::)
//  'trie'     — only prefix/keystroke trie suggestions
//  'both'     — both systems active simultaneously
const VALID_MODES = new Set(['semantic', 'trie', 'both']);

function _read() {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return VALID_MODES.has(v) ? v : 'both';
    } catch {
        return 'both';
    }
}

function _write(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* quota */ }
}

let _mode = _read();

const _listeners = new Set();

export const settings = {
    get mode() { return _mode; },

    set mode(v) {
        if (!VALID_MODES.has(v)) return;
        _mode = v;
        _write(v);
        _listeners.forEach(fn => fn(v));
    },

    /** Subscribe to mode changes. Returns an unsubscribe function. */
    onChange(fn) {
        _listeners.add(fn);
        return () => _listeners.delete(fn);
    },
};
