// inject.js
// Bootstrap layer.
// Responsibilities:
//  - Wait for Monaco to appear on window
//  - Call registerCompletionProvider
//  - Nothing else. No C++, no parsing, no STL.

import { registerCompletionProvider } from './monaco/provider.js';
import { mountPanel } from './ui/panel.js';

(function init() {
    const POLL_INTERVAL_MS = 500;
    const MAX_WAIT_MS = 30_000;
    let elapsed = 0;
    const EXT_URL = import.meta.url.replace(/inject\.js$/, "");
    window.EXT_URL = EXT_URL; // Expose it globally so parser.js can use it
    
    const interval = setInterval(() => {
        elapsed += POLL_INTERVAL_MS;

        if (window.monaco) {
            clearInterval(interval);
            registerCompletionProvider(window.monaco);
            mountPanel();
            return;
        }

        if (elapsed >= MAX_WAIT_MS) {
            clearInterval(interval);
            console.warn('LeetComplete: Timed out waiting for Monaco.');
        }
    }, POLL_INTERVAL_MS);
}());
