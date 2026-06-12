const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

export function about(term) {
    term.writeln('');
    term.writeln(`  ${C.cyan}${C.bold}cat about.txt${C.reset}`);
    term.writeln(`  ${C.dim}──────────────────────────────────────────────${C.reset}`);
    term.writeln('');
    // ── Edit this section ──────────────────────────────────
    term.writeln(`  hey, i'm ${C.cyan}${C.bold}roxx${C.reset}.`);
    term.writeln('');
    term.writeln(`  i build things for the web (and sometimes break them).`);
    term.writeln(`  i daily drive arch linux ${C.dim}(btw)${C.reset} with hyprland`);
    term.writeln(`  and i have opinions about your tech stack.`);
    term.writeln('');
    term.writeln(`  currently obsessed with:`);
    term.writeln(`    ${C.green}→${C.reset}  terminal UIs`);
    term.writeln(`    ${C.green}→${C.reset}  minimal software`);
    term.writeln(`    ${C.green}→${C.reset}  making computers go fast`);
    term.writeln(`    ${C.green}→${C.reset}  writing configs nobody asked for`);
    term.writeln('');
    term.writeln(`  ${C.dim}EOF${C.reset}`);
    term.writeln('');
}
