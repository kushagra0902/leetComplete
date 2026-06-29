// content.js
// Bootstrap: runs in the ISOLATED extension context.
// Injects two scripts into the PAGE context in order:
//   1. tree-sitter.js  — Emscripten bundle; exposes window.TreeSitter
//   2. inject.js       — our ES-module entry point; waits for Monaco then registers the provider

(function injectScripts() {


    // tree-sitter.js must be a classic script (not a module) because the
    // Emscripten runtime uses module.exports / window globals
    const tsScript = document.createElement('script');
    tsScript.src = chrome.runtime.getURL('tree-sitter.js');
    tsScript.type = 'text/javascript';

    // Once tree-sitter.js has executed, inject our ES-module entry point
    tsScript.addEventListener('load', () => {
        const injectScript = document.createElement('script');
        injectScript.src = chrome.runtime.getURL('inject.js');
        injectScript.type = 'module';
        document.head.appendChild(injectScript);
    });

    tsScript.addEventListener('error', (e) => {
        console.error('LeetComplete: Failed to load tree-sitter.js', e);
    });

    document.head.appendChild(tsScript);
}());
