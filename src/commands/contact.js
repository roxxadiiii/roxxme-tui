const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

export function contact(term) {
    term.writeln('');
    term.writeln(`  ${C.cyan}${C.bold}contact${C.reset}  ${C.dim}(i read my messages... eventually)${C.reset}`);
    term.writeln(`  ${C.dim}──────────────────────────────────────────────${C.reset}`);
    term.writeln('');
    // ── Edit these ────────────────────────────────────────
    term.writeln(`  ${C.green}email${C.reset}      roxx@example.com`);
    term.writeln(`  ${C.green}twitter${C.reset}    @roxxme`);
    term.writeln(`  ${C.green}discord${C.reset}    roxx#0000  ${C.dim}(ping me about Arch, i dare you)${C.reset}`);
    term.writeln('');
    term.writeln(`  ${C.dim}response time: somewhere between 5 minutes and 3 business weeks${C.reset}`);
    term.writeln('');
}
