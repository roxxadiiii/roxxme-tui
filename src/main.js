import { boot } from './boot.js';
import { createShell } from './shell.js';
import { applyTheme, DEFAULT_THEME } from './themes.js';

// ── Terminal init ──────────────────────────────────────────
const term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    allowProposedApi: true,
    scrollback: 1000,
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('terminal-container'));
fitAddon.fit();

// apply default theme (also sets background on #crt)
applyTheme(term, DEFAULT_THEME);

window.addEventListener('resize', () => fitAddon.fit());

// ── Kick off boot then hand over to shell ──────────────────
(async () => {
    await boot(term);
    createShell(term);
})();
