const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

// ── Edit your actual projects ──────────────────────────────
const projects = [
    {
        name: 'roxxme-tui',
        desc: 'this site. a linktree that boots like linux.',
        stack: 'xterm.js · vanilla js',
        url: 'https://github.com/roxxme/roxxme-tui',
        color: C.cyan,
    },
    {
        name: 'project-two',
        desc: 'something cool i built at 2am.',
        stack: 'rust · whatever',
        url: 'https://github.com/roxxme/project-two',
        color: C.green,
    },
    {
        name: 'project-three',
        desc: 'don\'t look at the commit messages.',
        stack: 'python · regret',
        url: 'https://github.com/roxxme/project-three',
        color: C.yellow,
    },
];

export function projectsCmd(term) {
    term.writeln('');
    term.writeln(`  ${C.cyan}${C.bold}ls ~/projects${C.reset}  ${C.dim}(things i built instead of sleeping)${C.reset}`);
    term.writeln(`  ${C.dim}──────────────────────────────────────────────────${C.reset}`);
    term.writeln('');

    for (const p of projects) {
        term.writeln(`  ${p.color}${C.bold}${p.name}${C.reset}`);
        term.writeln(`  ${C.dim}│${C.reset}  ${p.desc}`);
        term.writeln(`  ${C.dim}│  stack:${C.reset}  ${p.stack}`);
        term.writeln(`  ${C.dim}└  ${p.url}${C.reset}`);
        term.writeln('');
    }
}
