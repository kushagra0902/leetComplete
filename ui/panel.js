// panel.js
// A small floating control panel injected into the LeetCode page.
// Lets users choose: Semantic | Trie | Both
// State is managed by settings.js (persisted to localStorage).

import { settings } from '../completion/settings.js';

// ---------------------------------------------------------------------------
// CSS — injected once as a <style> tag
// ---------------------------------------------------------------------------

const CSS = `
#lc-panel {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    user-select: none;
}

#lc-panel-fab {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f89f1b, #e2456a);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    flex-shrink: 0;
}
#lc-panel-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}
#lc-panel-fab svg {
    pointer-events: none;
}

#lc-panel-card {
    background: #1e1e2e;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px;
    padding: 14px 16px 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    display: none;
    flex-direction: column;
    gap: 10px;
    min-width: 188px;
    animation: lc-slide-in 0.18s ease;
}
#lc-panel-card.open {
    display: flex;
}

@keyframes lc-slide-in {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
}

#lc-panel-title {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 2px;
}

.lc-mode-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    text-align: left;
    width: 100%;
}
.lc-mode-btn:hover {
    background: rgba(255,255,255,0.09);
}
.lc-mode-btn.active {
    background: rgba(248, 159, 27, 0.15);
    border-color: rgba(248, 159, 27, 0.5);
}
.lc-mode-btn .lc-icon {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
}
.lc-mode-btn .lc-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.85);
    line-height: 1.2;
}
.lc-mode-btn .lc-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    line-height: 1.2;
}
.lc-mode-btn.active .lc-label {
    color: #f89f1b;
}
`;

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const MODES = [
    { id: 'semantic', icon: '🔬', label: 'Semantic',    sub: 'Trigger chars only (. → ::)' },
    { id: 'trie',     icon: '🔤', label: 'Trie',         sub: 'Prefix match while typing' },
    { id: 'both',     icon: '✨', label: 'Both',          sub: 'Full power mode' },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function mountPanel() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Build panel root
    const panel = document.createElement('div');
    panel.id = 'lc-panel';

    // Card
    const card = document.createElement('div');
    card.id = 'lc-panel-card';

    const title = document.createElement('div');
    title.id = 'lc-panel-title';
    title.textContent = 'LeetComplete';
    card.appendChild(title);

    // Mode buttons
    const btnMap = {};
    for (const m of MODES) {
        const btn = document.createElement('button');
        btn.className = 'lc-mode-btn' + (settings.mode === m.id ? ' active' : '');
        btn.innerHTML = `
            <span class="lc-icon">${m.icon}</span>
            <span>
                <div class="lc-label">${m.label}</div>
                <div class="lc-sub">${m.sub}</div>
            </span>`;
        btn.addEventListener('click', () => {
            settings.mode = m.id;
        });
        btnMap[m.id] = btn;
        card.appendChild(btn);
    }

    // Keep buttons in sync with settings changes (e.g. from another tab)
    settings.onChange(newMode => {
        for (const [id, btn] of Object.entries(btnMap)) {
            btn.classList.toggle('active', id === newMode);
        }
    });

    // FAB (Floating Action Button)
    const fab = document.createElement('button');
    fab.id = 'lc-panel-fab';
    fab.title = 'LeetComplete settings';
    fab.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 7 4 4 20 4"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
            <line x1="12" y1="20" x2="12" y2="15"/>
            <polyline points="20 7 20 20 4 20"/>
        </svg>`;

    fab.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('open');
    });

    // Close card when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target)) {
            card.classList.remove('open');
        }
    });

    panel.appendChild(card);
    panel.appendChild(fab);
    document.body.appendChild(panel);
}
