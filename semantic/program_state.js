// program_state.js
// The central shared data structure of the project.
// Every editor feature (completion, hover, diagnostics) consumes ONLY this.
// Nothing in this file knows about Tree-sitter, Monaco, or STL.

let _idCounter = 0;
function nextId() {
    return ++_idCounter;
}

// ---------------------------------------------------------------------------
// Variable
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Variable
 * @property {number}  id
 * @property {string}  name
 * @property {string}  type              — raw type string, e.g. "priority_queue<int>"
 * @property {string}  baseType          — extracted base, e.g. "priority_queue"
 * @property {string}  templateArgs      — e.g. "int" or "int, int"
 * @property {string}  scopeId
 * @property {Object}  declarationLocation  — { row, column }
 */

// ---------------------------------------------------------------------------
// Function
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} CppFunction
 * @property {number}  id
 * @property {string}  name
 * @property {string}  returnType
 * @property {Array}   parameters        — [{ name, type }]
 * @property {string}  scopeId
 * @property {Object}  declarationLocation
 */

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Scope
 * @property {string}  id
 * @property {string}  kind              — "global" | "function" | "block" | "class"
 * @property {string|null} parentId
 */

// ---------------------------------------------------------------------------
// ProgramState
// ---------------------------------------------------------------------------

export class ProgramState {
    constructor() {
        /** @type {Map<string, Variable>}  keyed by variable name */
        this.variables = new Map();

        /** @type {Map<string, CppFunction>}  keyed by function name */
        this.functions = new Map();

        /** @type {Scope[]} */
        this.scopes = [];

        /** @type {Map<string, string>}  typedef/alias → resolved type */
        this.types = new Map();

        /** @type {Set<string>}  e.g. "std", "using namespace std" */
        this.namespaces = new Set();

        /** @type {Set<string>}  raw include strings, e.g. "<vector>" */
        this.includes = new Set();
    }

    // ------------------------------------------------------------------
    // Variable helpers
    // ------------------------------------------------------------------

    /**
     * Register a variable into the global scope (scope-aware scopes come later).
     * @param {string} name
     * @param {string} type
     * @param {{ row: number, column: number }} loc
     */
    addVariable(name, type, loc = { row: 0, column: 0 }) {
        const baseType = extractBaseType(type);
        const templateArgs = extractTemplateArgs(type);

        this.variables.set(name, {
            id: nextId(),
            name,
            type,
            baseType,
            templateArgs,
            scopeId: 'global',
            declarationLocation: loc,
        });
    }

    /**
     * @param {string} name
     * @returns {Variable|undefined}
     */
    getVariable(name) {
        return this.variables.get(name);
    }

    // ------------------------------------------------------------------
    // Function helpers
    // ------------------------------------------------------------------

    addFunction(name, returnType, parameters = [], loc = { row: 0, column: 0 }) {
        this.functions.set(name, {
            id: nextId(),
            name,
            returnType,
            parameters,
            scopeId: 'global',
            declarationLocation: loc,
        });
    }

    getFunction(name) {
        return this.functions.get(name);
    }

    // ------------------------------------------------------------------
    // Snapshot for debugging
    // ------------------------------------------------------------------

    toDebugObject() {
        return {
            variables: Object.fromEntries(this.variables),
            functions: Object.fromEntries(this.functions),
            scopes: this.scopes,
            types: Object.fromEntries(this.types),
            namespaces: [...this.namespaces],
            includes: [...this.includes],
        };
    }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function extractBaseType(type) {
    // "std::unordered_map<int, int>" -> "unordered_map"
    // "vector<pair<int,int>>" → "vector"
    
    // First, strip away any namespace prefixes (e.g. "std::")
    let cleanType = type.replace(/(?:[a-zA-Z_]\w*::)+/g, '');
    
    // Then extract the base name (ignoring const and templates)
    const m = cleanType.match(/^\s*(?:const\s+)?([a-zA-Z_]\w*)/);
    return m ? m[1] : cleanType;
}

function extractTemplateArgs(type) {
    // "priority_queue<int>" → "int"
    // "unordered_map<int, int>" → "int, int"
    const start = type.indexOf('<');
    const end = type.lastIndexOf('>');
    if (start !== -1 && end !== -1 && end > start) {
        return type.slice(start + 1, end).trim();
    }
    return '';
}
