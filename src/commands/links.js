const C = {
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

// ── Edit these to your actual links ───────────────────────
const links = [
    { icon: '', label: 'GitHub', url: 'https://github.com/roxxme', color: C.white },
    { icon: '', label: 'Twitter', url: 'https://twitter.com/roxxme', color: C.cyan },
    { icon: '', label: 'LinkedIn', url: 'https://linkedin.com/in/roxxme', color: C.blue },
    { icon: '󰕮', label: 'Email', url: 'mailto:roxx@example.com', color: C.yellow },
];

// Fallback if nerd fonts not available
const C2 = { ...C, white: '\x1b[37m' };

export function linksCmd(term) {
    term.writeln('');
    term.writeln(`  ${C.cyan}${C.bold}find me on the internet${C.reset}  ${C.dim}(i'm everywhere, like a virus)${C.reset}`);
    term.writeln(`  ${C.dim}─────────────────────────────────────────${C.reset}`);

    for (const { icon, label, url, color } of links) {
        term.writeln(`  ${color}${icon}  ${label.padEnd(10)}${C.reset}  ${C.dim}${url}${C.reset}`);
    }

    term.writeln('');
    term.writeln(`  ${C.dim}ctrl+click links if your terminal supports it${C.reset}`);
    term.writeln('');
}
