const C = {
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

export function help(term) {
    term.writeln('');
    term.writeln(`  ${C.cyan}${C.bold}Available commands${C.reset}  ${C.dim}(you actually read the docs, respect)${C.reset}`);
    term.writeln(`  ${C.dim}────────────────────────────────────────────────${C.reset}`);

    const cmds = [
        ['links', 'all my links — github, socials, the usual'],
        ['about', 'who even am i (great question)'],
        ['projects', 'things i built instead of sleeping'],
        ['contact', 'ways to reach me (or not)'],
        ['theme', 'list or switch colorscheme  e.g. theme dracula'],
        ['neofetch', 'run fastfetch again for reasons'],
        ['ls', 'list the "filesystem"'],
        ['clear', 'clear the screen'],
        ['exit', 'close tab (coward)'],
    ];

    for (const [cmd, desc] of cmds) {
        term.writeln(`  ${C.green}${cmd.padEnd(12)}${C.reset}${C.dim}→${C.reset}  ${desc}`);
    }

    term.writeln('');
    term.writeln(`  ${C.dim}tip: tab completion works. you're welcome.${C.reset}`);
    term.writeln('');
}
