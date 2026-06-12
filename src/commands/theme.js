import { themes, applyTheme } from '../themes.js';

const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

// ── theme [name] ───────────────────────────────────────────
// theme          → list all themes
// theme <name>   → apply theme
export function themeCmd(term, args) {
    const target = args[0];

    // ── List themes ──────────────────────────────────────────
    if (!target) {
        term.writeln('');
        term.writeln(`  ${C.cyan}${C.bold}available themes${C.reset}  ${C.dim}(because one colorscheme is never enough)${C.reset}`);
        term.writeln(`  ${C.dim}──────────────────────────────────────────────────${C.reset}`);
        term.writeln('');

        const keys = Object.keys(themes);
        // print in two columns
        for (let i = 0; i < keys.length; i += 2) {
            const left = keys[i] ? `${C.green}${keys[i].padEnd(26)}${C.reset}${C.dim}${themes[keys[i]]._label}${C.reset}` : '';
            const right = keys[i + 1] ? `  ${C.green}${keys[i + 1].padEnd(26)}${C.reset}${C.dim}${themes[keys[i + 1]]._label}${C.reset}` : '';
            term.writeln(`  ${left}${right}`);
        }

        term.writeln('');
        term.writeln(`  ${C.dim}usage: ${C.reset}theme <name>  ${C.dim}e.g. theme dracula${C.reset}`);
        term.writeln('');
        return;
    }

    // ── Apply theme ──────────────────────────────────────────
    const ok = applyTheme(term, target);

    if (ok) {
        term.writeln('');
        term.writeln(`  ${C.green}theme set to ${C.bold}${target}${C.reset}  ${C.dim}→ ${themes[target]._label}${C.reset}`);
        term.writeln(`  ${C.dim}(your taste is valid. mostly.)${C.reset}`);
        term.writeln('');
    } else {
        term.writeln('');
        term.writeln(`  ${C.red}unknown theme: ${target}${C.reset}`);
        term.writeln(`  ${C.dim}type 'theme' to list all available themes${C.reset}`);
        term.writeln('');
    }
}
