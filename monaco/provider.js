// provider.js
// Responsibility: Monaco integration layer.
//
// Rules:
//  - Converts Monaco events into calls to the internal pipeline.
//  - Converts internal suggestions into Monaco completion items.
//  - Never knows about C++, Tree-sitter, or AST internals.
//  - Owns the debounce + parse→analyze→cache pipeline.

import { initParser, parseSource } from '../parser/parser.js';
import { analyzeSemantics } from '../semantic/analyzer.js';
import { analyzeCursor } from '../completion/cursor_analyzer.js';
import { getSuggestions } from '../completion/engine.js';
import { debounce } from '../utils/debounce.js';
import { settings } from '../completion/settings.js';
import { globalTrie } from '../completion/trie.js';

// ---------------------------------------------------------------------------
// Internal state — one ProgramState per active model
// ---------------------------------------------------------------------------

/** @type {Map<string, ProgramState>}  model URI → ProgramState */
const _stateByModel = new Map();

/** @type {Map<string, Function>}  model URI → debounced updater */
const _updaterByModel = new Map();

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Called once from inject.js when window.monaco is available.
 * @param {monaco} monaco
 */
export async function registerCompletionProvider(monaco) {
    // Boot the parser (loads Tree-sitter WASM if available, else uses mock)
    await initParser();

    console.log('LeetComplete: C++ Autocomplete active.');

    // Register the completion provider for C++
    monaco.languages.registerCompletionItemProvider('cpp', {
        triggerCharacters: ['.', '>', ':'],

        provideCompletionItems(model, position) {
            const textBeforeCursor = model.getLineContent(position.lineNumber)
                .substring(0, position.column - 1);

            const cursorCtx = analyzeCursor(textBeforeCursor);
            const programState = _stateByModel.get(model.uri.toString());
            
            let suggestions = [];
            
            // 1. Semantic Suggestions
            if (settings.mode === 'semantic' || settings.mode === 'both') {
                suggestions = getSuggestions(programState, cursorCtx).map(s => _toMonacoItem(s, monaco));
            }

            // 2. Trie / Prefix Suggestions
            if (settings.mode === 'trie' || settings.mode === 'both') {
                // Trie only makes sense for bare identifiers (typing keywords/snippets), not member access
                if (cursorCtx.expressionType === 'identifier') {
                    const trieResults = globalTrie.search(cursorCtx.memberPrefix);
                    const trieSuggestions = trieResults.map(t => _toMonacoItem(t, monaco));
                    suggestions = [...suggestions, ...trieSuggestions];
                }
            }

            return { suggestions };
        }
    });

    // Wire up all existing + future models
    _attachToAllModels(monaco);
    monaco.editor.onDidCreateModel(model => {
        _attachModel(monaco, model);
    });

    // CRITICAL: LeetCode disables quick suggestions for free users.
    // We must force-enable them on the editor instances so Monaco actually fires our provider!
    const forceEnableSuggestions = (editor) => {
        editor.updateOptions({
            suggestOnTriggerCharacters: true,
            quickSuggestions: true
        });
    };

    monaco.editor.getEditors().forEach(forceEnableSuggestions);
    monaco.editor.onDidCreateEditor(forceEnableSuggestions);
}

// ---------------------------------------------------------------------------
// Model attachment
// ---------------------------------------------------------------------------

function _attachToAllModels(monaco) {
    const models = monaco.editor.getModels();
    models.forEach(model => {
        _attachModel(monaco, model);
    });
}

function _attachModel(monaco, model) {
    const lang = model.getLanguageId();
    if (lang !== 'cpp') return;

    const uri = model.uri.toString();

    // Create a debounced updater for this specific model
    const debouncedUpdate = debounce((sourceCode) => {
        _runPipeline(uri, sourceCode);
    }, 300);

    _updaterByModel.set(uri, debouncedUpdate);

    // Listen for content changes
    model.onDidChangeContent(() => {
        debouncedUpdate(model.getValue());
    });

    // Parse the initial content immediately (no debounce on first load)
    _runPipeline(uri, model.getValue());
}

// ---------------------------------------------------------------------------
// Parse → Analyze → Cache pipeline
// ---------------------------------------------------------------------------

function _runPipeline(modelUri, sourceCode) {
    try {
        // Stage 1: Source → AST  (parser knows nothing about Monaco)
        const ast = parseSource(sourceCode);

        // Stage 2: AST → ProgramState  (analyzer knows nothing about Monaco)
        const programState = analyzeSemantics(ast);

        // Stage 3: Cache the result
        _stateByModel.set(modelUri, programState);
    } catch (err) {
        console.error('LeetComplete: Pipeline error', err);
    }
}

// ---------------------------------------------------------------------------
// Monaco item conversion
// ---------------------------------------------------------------------------

const _kindMap = {
    Method: 'Method',
    Function: 'Function',
    Variable: 'Variable',
    Field: 'Field',
    Class: 'Class',
    Keyword: 'Keyword',
    Snippet: 'Snippet',
};

function _toMonacoItem(suggestion, monaco) {
    const kindKey = _kindMap[suggestion.kind] || 'Text';
    const isSnippet = suggestion.kind === 'Snippet' || (suggestion.insertText || '').includes('${');
    
    return {
        label: suggestion.label,
        kind: monaco.languages.CompletionItemKind[kindKey] ??
            monaco.languages.CompletionItemKind.Text,
        detail: suggestion.detail || '',
        documentation: suggestion.documentation || '',
        insertText: suggestion.insertText || suggestion.label,
        insertTextRules: isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : monaco.languages.CompletionItemInsertTextRule.None,
        sortText: suggestion.sortText || suggestion.label,
    };
}
