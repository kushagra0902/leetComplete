// engine.js
// Responsibility: ProgramState → Suggestions.
//
// Rules:
//  - Never inspects AST nodes.
//  - Never calls Tree-sitter.
//  - Never reads Monaco models directly.
//  - Consumes only ProgramState + CursorContext.
//  - Delegates STL lookups entirely to stl_database.js.

import { getSTLMethodsFiltered } from './stl_database.js';

/**
 * Produce completion suggestions given the current program state and
 * a pre-analysed cursor context.
 *
 * @param {ProgramState}  programState — cached semantic snapshot
 * @param {CursorContext} cursorCtx    — from cursor_analyzer.js
 * @returns {Suggestion[]}
 */
export function getSuggestions(programState, cursorCtx) {
    if (!programState) return [];

    const { expressionType, object, memberPrefix } = cursorCtx;

    switch (expressionType) {
        case 'member':
        case 'arrow':
            return _getMemberSuggestions(programState, object, memberPrefix);
        case 'scope':
            return _getScopeSuggestions(programState, object, memberPrefix);
        case 'identifier':
            return _getIdentifierSuggestions(programState, memberPrefix);
        default:
            return [];
    }
}

// ---------------------------------------------------------------------------
// Member access:  obj.xxx  or  ptr->xxx
// ---------------------------------------------------------------------------

function _getMemberSuggestions(programState, objectName, prefix) {
    const typeInfo = _resolveExpressionType(programState, objectName);
    if (!typeInfo || !typeInfo.baseType) return [];

    const methods = getSTLMethodsFiltered(typeInfo.baseType, prefix);

    return methods.map(m => ({
        label: m.name,
        kind: 'Method',
        detail: m.signature,
        documentation: m.doc,
        insertText: m.name,
        sortText: m.name,
    }));
}

// ---------------------------------------------------------------------------
// Expression Evaluator (handles nested vectors, pairs, arrays)
// ---------------------------------------------------------------------------

function _resolveExpressionType(programState, expr) {
    expr = expr.trim();
    if (!expr) return null;

    // Quick out for simple variables (e.g. `pq`)
    if (/^[a-zA-Z_]\w*$/.test(expr)) {
        return programState.getVariable(expr);
    }

    // Parse the expression chain (e.g., `adj[u][v].first`)
    const tokens = [];
    let current = '';
    for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '[') {
            if (current) { tokens.push({ type: 'prop', val: current }); current = ''; }
            let depth = 1; i++;
            while (i < expr.length && depth > 0) {
                if (expr[i] === '[') depth++;
                if (expr[i] === ']') depth--;
                i++;
            }
            i--;
            tokens.push({ type: 'index' });
        } else if (expr[i] === '.') {
            if (current) { tokens.push({ type: 'prop', val: current }); current = ''; }
            tokens.push({ type: 'dot' });
        } else if (expr[i] === '-' && expr[i+1] === '>') {
            if (current) { tokens.push({ type: 'prop', val: current }); current = ''; }
            tokens.push({ type: 'arrow' });
            i++;
        } else {
            current += expr[i];
        }
    }
    if (current) tokens.push({ type: 'prop', val: current });

    if (tokens.length === 0 || tokens[0].type !== 'prop') return null;

    // Start with the root variable
    let currentType = programState.getVariable(tokens[0].val);
    if (!currentType) return null;

    // Evaluate left to right
    for (let i = 1; i < tokens.length; i++) {
        const op = tokens[i];
        
        if (op.type === 'index') {
            // Container indexing: vector<vector<int>>[0] -> vector<int>
            const innerType = _extractContainerValueType(currentType);
            if (!innerType) return null;
            currentType = { 
                type: innerType, 
                baseType: _extractBaseType(innerType), 
                templateArgs: _extractTemplateArgs(innerType) 
            };
        } 
        else if ((op.type === 'dot' || op.type === 'arrow') && i + 1 < tokens.length && tokens[i+1].type === 'prop') {
            // Member access: pair.first
            const member = tokens[i+1].val;
            i++; 
            if (currentType.baseType === 'pair') {
                const args = _splitTemplateArgs(currentType.templateArgs);
                if (member === 'first' && args.length >= 1) {
                    currentType = _createDummyVar(args[0]);
                } else if (member === 'second' && args.length >= 2) {
                    currentType = _createDummyVar(args[1]);
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }
    }
    return currentType;
}

function _createDummyVar(typeStr) {
    return {
        type: typeStr,
        baseType: _extractBaseType(typeStr),
        templateArgs: _extractTemplateArgs(typeStr)
    };
}

function _extractContainerValueType(varInfo) {
    const base = varInfo.baseType;
    const argsStr = varInfo.templateArgs;
    if (!argsStr) return null;
    
    const args = _splitTemplateArgs(argsStr);
    if (args.length === 0) return null;

    if (['vector', 'deque', 'queue', 'stack', 'priority_queue'].includes(base)) {
        return args[0]; // e.g. vector<int> -> int
    }
    if (['map', 'unordered_map'].includes(base)) {
        return args.length >= 2 ? args[1] : null; // e.g. map<K, V> -> V
    }
    return null;
}

function _splitTemplateArgs(argsStr) {
    const args = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < argsStr.length; i++) {
        const c = argsStr[i];
        if (c === '<') depth++;
        else if (c === '>') depth--;
        else if (c === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
            continue;
        }
        current += c;
    }
    if (current) args.push(current.trim());
    return args;
}

function _extractBaseType(type) {
    let cleanType = type.replace(/(?:[a-zA-Z_]\w*::)+/g, '');
    const m = cleanType.match(/^\s*(?:const\s+)?([a-zA-Z_]\w*)/);
    return m ? m[1] : cleanType;
}

function _extractTemplateArgs(type) {
    const start = type.indexOf('<');
    const end = type.lastIndexOf('>');
    if (start !== -1 && end !== -1 && end > start) {
        return type.slice(start + 1, end).trim();
    }
    return '';
}

// ---------------------------------------------------------------------------
// Scope resolution:  NS::xxx
// ---------------------------------------------------------------------------

function _getScopeSuggestions(programState, namespaceName, prefix) {
    // Future: resolve namespace members from programState.namespaces
    // For now return empty — this is a placeholder for the interface.
    return [];
}

// ---------------------------------------------------------------------------
// Bare identifier (not preceded by any operator):  typing "pu" → "push_back"?
// ---------------------------------------------------------------------------

function _getIdentifierSuggestions(programState, prefix) {
    if (!prefix || prefix.length < 1) return [];

    const suggestions = [];
    const lp = prefix.toLowerCase();

    // Suggest visible variables
    for (const [name, variable] of programState.variables) {
        if (name.toLowerCase().startsWith(lp)) {
            suggestions.push({
                label: name,
                kind: 'Variable',
                detail: variable.type,
                documentation: `Variable of type ${variable.type}`,
                insertText: name,
                sortText: '0' + name,   // variables sort before functions
            });
        }
    }

    // Suggest visible functions
    for (const [name, func] of programState.functions) {
        if (name.toLowerCase().startsWith(lp)) {
            const paramStr = func.parameters.map(p => `${p.type} ${p.name}`).join(', ');
            suggestions.push({
                label: name,
                kind: 'Function',
                detail: `${func.returnType} ${name}(${paramStr})`,
                documentation: `Function`,
                insertText: name,
                sortText: '1' + name,
            });
        }
    }

    return suggestions;
}
