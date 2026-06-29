// cursor_analyzer.js
// Responsibility: Given the text before the cursor, determine what
// the user is trying to complete.
//
// This module uses a pure backward scanner — no regex, no AST.
// Its OUTPUT interface is stable: the rest of the pipeline must never
// change based on whether we're using a scanner or Tree-sitter underneath.
// When we eventually integrate Tree-sitter for cursor analysis, only the
// internals of this file change; engine.js stays untouched.

/**
 * @typedef {Object} CursorContext
 * @property {"member" | "arrow" | "scope" | "identifier" | "unknown"} expressionType
 * @property {string} object         — the object/namespace before the operator
 * @property {string} memberPrefix   — characters typed after the operator
 * @property {string} operator       — "." | "->" | "::"
 */

/**
 * Analyse the text immediately before the cursor.
 *
 * @param {string} textBeforeCursor  — full line content up to (not including) the cursor column
 * @returns {CursorContext}
 */
export function analyzeCursor(textBeforeCursor) {
    const ctx = _backwardScan(textBeforeCursor);
    return ctx;
}

// ---------------------------------------------------------------------------
// Backward scanner
// ---------------------------------------------------------------------------

function _backwardScan(text) {
    let i = text.length - 1;

    // Skip trailing whitespace
    while (i >= 0 && text[i] === ' ') i--;

    // Collect the member prefix (characters typed after the operator)
    let memberPrefix = '';
    while (i >= 0 && _isIdentChar(text[i])) {
        memberPrefix = text[i] + memberPrefix;
        i--;
    }

    // Detect the operator: ".", "->", "::"
    let operator = '';
    if (i >= 0 && text[i] === '.') {
        operator = '.';
        i--;
    } else if (i >= 1 && text[i] === '>' && text[i - 1] === '-') {
        operator = '->';
        i -= 2;
    } else if (i >= 1 && text[i] === ':' && text[i - 1] === ':') {
        operator = '::';
        i -= 2;
    }

    if (!operator) {
        // No member access — could be a bare identifier or unknown
        if (memberPrefix) {
            return {
                expressionType: 'identifier',
                object: '',
                memberPrefix,
                operator: '',
            };
        }
        return { expressionType: 'unknown', object: '', memberPrefix: '', operator: '' };
    }

    // Collect the full object expression (e.g., `nums[0]`, `mp.begin()`, `pair.first`)
    let object = '';
    let brackets = 0;
    let parens = 0;

    while (i >= 0) {
        const c = text[i];
        if (c === ']') { brackets++; object = c + object; i--; continue; }
        if (c === '[') { brackets--; object = c + object; i--; continue; }
        if (c === ')') { parens++; object = c + object; i--; continue; }
        if (c === '(') { parens--; object = c + object; i--; continue; }
        
        if (brackets > 0 || parens > 0) {
            object = c + object;
            i--;
            continue;
        }

        // Allow identifiers
        if (_isIdentChar(c)) {
            object = c + object;
            i--;
            continue;
        }

        // Allow member access operators in the chain
        if (c === '.') {
            object = c + object;
            i--;
            continue;
        }
        if (c === '>' && i >= 1 && text[i - 1] === '-') {
            object = '->' + object;
            i -= 2;
            continue;
        }
        if (c === ':' && i >= 1 && text[i - 1] === ':') {
            object = '::' + object;
            i -= 2;
            continue;
        }

        // If we hit anything else (spaces, semicolons, plus signs), the chain is broken
        break;
    }

    const expressionType =
        operator === '->' ? 'arrow'  :
        operator === '::' ? 'scope'  :
        'member';

    return { expressionType, object, memberPrefix, operator };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _isIdentChar(ch) {
    return /[a-zA-Z0-9_]/.test(ch);
}
