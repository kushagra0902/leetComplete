// analyzer.js
// Responsibility: AST (Tree-sitter SyntaxNode) → ProgramState.
//
// Rules:
//   - ONLY this module is allowed to inspect AST node internals.
//   - Every other module (completion, hover, diagnostics) consumes
//     ProgramState exclusively — never raw AST nodes.
//   - This module has no knowledge of Monaco, STL, or how completions work.

import { ProgramState }    from './program_state.js';
import { walkAST }         from '../parser/walker.js';

/**
 * Walk the Tree-sitter AST and build a ProgramState.
 *
 * @param {import('web-tree-sitter').SyntaxNode} ast  — rootNode from parseSource()
 * @returns {ProgramState}
 */
export function analyzeSemantics(ast) {
    const state = new ProgramState();
    if (!ast) return state;

    walkAST(ast, {
        // ----------------------------------------------------------------
        // #include <vector>  /  #include "foo.h"
        // ----------------------------------------------------------------
        preproc_include(node) {
            const pathNode = node.namedChildren[0];
            if (pathNode) state.includes.add(pathNode.text);
            return false;
        },

        // ----------------------------------------------------------------
        // using namespace std;
        // ----------------------------------------------------------------
        using_declaration(node) {
            // text is something like "using namespace std ;"
            const m = node.text.replace(/\s+/g, ' ').match(/using\s+namespace\s+([a-zA-Z_]\w*)/);
            if (m) state.namespaces.add(m[1]);
            return false;
        },

        // ----------------------------------------------------------------
        // Variable declarations
        //
        // Covers:
        //   int x;
        //   vector<int> nums;
        //   priority_queue<int, vector<int>, greater<int>> pq;
        //   const string s = "hello";
        //   auto it = mp.begin();
        //   unordered_map<int, vector<pair<int,int>>> adj;
        // ----------------------------------------------------------------
        declaration(node) {
            const typeNode       = node.childForFieldName('type');
            const declaratorNode = node.childForFieldName('declarator');

            if (!typeNode || !declaratorNode) return false;

            const typeName = _buildTypeString(typeNode);
            const varName  = _extractDeclaratorName(declaratorNode);

            if (varName && typeName && !_isFunctionDeclarator(declaratorNode)) {
                state.addVariable(varName, typeName, node.startPosition);
            }

            return false; // don't descend — inner declarations handled separately
        },

        // ----------------------------------------------------------------
        // Function definitions
        //
        // Covers:
        //   void solve(int n, vector<int>& nums) {
        //   ListNode* reverseList(ListNode* head) {
        //   int maxProfit(vector<int>& prices) {
        // ----------------------------------------------------------------
        function_definition(node) {
            const returnTypeNode  = node.childForFieldName('type');
            const declaratorNode  = node.childForFieldName('declarator');

            if (!declaratorNode) return false;

            const returnType = returnTypeNode ? _buildTypeString(returnTypeNode) : 'void';
            const funcName   = _extractFunctionName(declaratorNode);
            const params     = _extractParameters(declaratorNode);

            if (funcName) {
                state.addFunction(funcName, returnType, params, node.startPosition);

                // Parameters are visible inside the function body
                for (const p of params) {
                    if (p.name && p.type) {
                        state.addVariable(p.name, p.type, node.startPosition);
                    }
                }
            }

            // Descend to pick up local variable declarations inside the body
            return true;
        },

        // ----------------------------------------------------------------
        // Local declarations inside compound_statement (function bodies)
        // These have the same structure as top-level declarations.
        // walkAST will invoke 'declaration' for them automatically since
        // we return true from function_definition above.
        // ----------------------------------------------------------------

        // ----------------------------------------------------------------
        // Fallback for Tree-sitter C++ tie-breaker quirks
        // ----------------------------------------------------------------
        expression_statement(node) {
            // Sometimes "unordered_map<int, int> mp;" is mis-parsed as a mangled 
            // binary expression because Tree-sitter doesn't know 'unordered_map' is a type.
            const text = node.text.trim();
            
            // Fast check: does it look like "Type name;" or "Type<...> name;"?
            const m = text.match(/^([a-zA-Z_]\w*(?:\s*<[^;{]+>)?)\s+([a-zA-Z_]\w*)\s*(?:=[^;]+)?;/);
            if (m) {
                const typeName = m[1].trim();
                const varName  = m[2].trim();
                
                // Exclude obvious non-types (like "return x;")
                if (!['return', 'if', 'while', 'for'].includes(typeName.split('<')[0])) {
                    state.addVariable(varName, typeName, node.startPosition);
                }
            }
            return false;
        },
    });

    return state;
}

// ---------------------------------------------------------------------------
// Type string builder
// Reconstructs the full C++ type string from a Tree-sitter type node.
// ---------------------------------------------------------------------------

/**
 * Build a human-readable type string from any Tree-sitter type node.
 *
 * @param {import('web-tree-sitter').SyntaxNode} node
 * @returns {string}
 */
function _buildTypeString(node) {
    if (!node) return 'auto';

    switch (node.type) {
        // Primitive types: int, char, bool, void, double, float …
        case 'primitive_type':
            return node.text;

        // Named types: MyClass, ListNode, TreeNode …
        case 'type_identifier':
            return node.text;

        // Sized types: long long, unsigned int, signed char …
        case 'sized_type_specifier':
            return node.text.trim();

        // Qualified: std::string, std::vector …
        case 'qualified_identifier':
            return node.text;

        // Template types: vector<int>, unordered_map<int,int> …
        case 'template_type': {
            const nameNode  = node.childForFieldName('name');
            const argsNode  = node.childForFieldName('arguments');
            const name      = nameNode ? nameNode.text : '';
            if (!argsNode) return name;
            const args = _extractTemplateArgs(argsNode);
            return `${name}<${args}>`;
        }

        // const / volatile qualifiers wrap another type node
        case 'type_qualifier':
            return node.text; // e.g. "const"

        // auto
        case 'auto':
            return 'auto';

        // Pointer to type: int*
        case 'pointer_type': {
            const inner = node.namedChildren[0];
            return inner ? `${_buildTypeString(inner)}*` : node.text;
        }

        default:
            // Fallback: return raw text (handles edge cases)
            return node.text.trim();
    }
}

// ---------------------------------------------------------------------------
// Template argument extractor
// ---------------------------------------------------------------------------

/**
 * Given a template_argument_list node, produce the comma-separated arg string.
 * Handles nested templates like unordered_map<int, vector<pair<int,int>>>.
 *
 * @param {import('web-tree-sitter').SyntaxNode} argsNode  — template_argument_list
 * @returns {string}
 */
function _extractTemplateArgs(argsNode) {
    const parts = [];
    for (const child of argsNode.namedChildren) {
        switch (child.type) {
            case 'type_descriptor': {
                // type_descriptor has a `type` field
                const typeField = child.childForFieldName('type');
                parts.push(typeField ? _buildTypeString(typeField) : child.text);
                break;
            }
            case 'number_literal':
            case 'identifier':
            case 'template_type':
            case 'type_identifier':
            case 'primitive_type':
            case 'qualified_identifier':
                parts.push(_buildTypeString(child));
                break;
            default:
                parts.push(child.text);
        }
    }
    return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Declarator name extractor
// Walks potentially-nested declarators to find the raw identifier.
// ---------------------------------------------------------------------------

/**
 * @param {import('web-tree-sitter').SyntaxNode} node
 * @returns {string | null}
 */
function _extractDeclaratorName(node) {
    if (!node) return null;

    switch (node.type) {
        case 'identifier':
            return node.text;

        // int x = 5;  →  init_declarator → identifier
        case 'init_declarator':
            return _extractDeclaratorName(node.childForFieldName('declarator'));

        // int* p;  →  pointer_declarator → identifier
        case 'pointer_declarator':
            return _extractDeclaratorName(node.childForFieldName('declarator'));

        // int& r = x;  →  reference_declarator → identifier
        // reference_declarator's last named child is the identifier
        case 'reference_declarator': {
            const children = node.namedChildren;
            return children.length > 0
                ? _extractDeclaratorName(children[children.length - 1])
                : null;
        }

        // int arr[10];  →  array_declarator → identifier
        case 'array_declarator':
            return _extractDeclaratorName(node.childForFieldName('declarator'));

        // Parenthesised declarator: int (x) — rare but valid
        case 'parenthesized_declarator':
            return _extractDeclaratorName(node.namedChildren[0]);

        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Function declarator helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the declarator is a function_declarator (not a variable).
 * This guards against treating function DECLARATIONS as variable declarations.
 *
 * @param {import('web-tree-sitter').SyntaxNode} node
 * @returns {boolean}
 */
function _isFunctionDeclarator(node) {
    if (!node) return false;
    if (node.type === 'function_declarator') return true;
    // Could be wrapped in a pointer: int (*fp)() — unusual in competitive C++ but handle it
    const inner = node.childForFieldName('declarator');
    return inner ? _isFunctionDeclarator(inner) : false;
}

/**
 * Extract the function name from a function_declarator node.
 *
 * @param {import('web-tree-sitter').SyntaxNode} node  — function_declarator or wrapping pointer
 * @returns {string | null}
 */
function _extractFunctionName(node) {
    if (!node) return null;

    if (node.type === 'function_declarator') {
        const nameNode = node.childForFieldName('declarator');
        // nameNode is usually an identifier or a pointer_declarator for pointer-returning fns
        if (!nameNode) return null;
        if (nameNode.type === 'identifier') return nameNode.text;
        if (nameNode.type === 'pointer_declarator') {
            return _extractDeclaratorName(nameNode);
        }
        return nameNode.text;
    }

    // Recurse through pointer_declarator wrappers (e.g. ListNode* fn() {...})
    const inner = node.childForFieldName('declarator');
    return inner ? _extractFunctionName(inner) : null;
}

/**
 * Extract parameter list from a function_declarator node.
 *
 * @param {import('web-tree-sitter').SyntaxNode} node
 * @returns {{ name: string, type: string }[]}
 */
function _extractParameters(node) {
    if (!node) return [];

    // Find the function_declarator, possibly nested in a pointer_declarator
    const funcDeclarator = _findFunctionDeclarator(node);
    if (!funcDeclarator) return [];

    const paramListNode = funcDeclarator.childForFieldName('parameters');
    if (!paramListNode) return [];

    const params = [];
    for (const child of paramListNode.namedChildren) {
        if (child.type !== 'parameter_declaration') continue;

        const typeNode       = child.childForFieldName('type');
        const declaratorNode = child.childForFieldName('declarator');

        if (!typeNode) continue;

        const paramType = _buildTypeString(typeNode);
        const paramName = declaratorNode ? _extractDeclaratorName(declaratorNode) : null;

        params.push({ type: paramType, name: paramName || '' });
    }

    return params;
}

function _findFunctionDeclarator(node) {
    if (!node) return null;
    if (node.type === 'function_declarator') return node;
    const inner = node.childForFieldName('declarator');
    return inner ? _findFunctionDeclarator(inner) : null;
}
