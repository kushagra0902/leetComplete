// walker.js
// Generic read-only traversal of a Tree-sitter SyntaxNode tree.
// Works with real web-tree-sitter SyntaxNode objects.
// Has zero knowledge of C++ semantics.

/**
 * Depth-first traversal over named children only.
 * (Anonymous nodes like ';', '{', '(' carry no semantic meaning.)
 *
 * visitor is a plain object keyed by node type string.
 * If a visitor function returns `false`, the node's children are NOT descended.
 *
 * @param {import('web-tree-sitter').SyntaxNode} node
 * @param {Record<string, (node: SyntaxNode) => void | false>} visitor
 */
export function walkAST(node, visitor) {
    if (!node) return;

    let descend = true;
    const handler = visitor[node.type];
    if (handler) {
        const result = handler(node);
        if (result === false) descend = false;
    }

    if (descend) {
        // namedChildren skips anonymous syntax tokens (`;`, `{`, `(`, etc.)
        const children = node.namedChildren ?? node.children ?? [];
        for (const child of children) {
            walkAST(child, visitor);
        }
    }
}

/**
 * Collect all named descendant nodes of the given type.
 *
 * @param {import('web-tree-sitter').SyntaxNode} root
 * @param {string} type
 * @returns {import('web-tree-sitter').SyntaxNode[]}
 */
export function findAll(root, type) {
    const results = [];
    walkAST(root, {
        [type](node) { results.push(node); }
    });
    return results;
}
