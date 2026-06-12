const C = {
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

// fake filesystem tree
const tree = {
    '~': ['projects/', 'dotfiles/', 'about.txt', 'links.txt', '.secrets/'],
    'projects': ['roxxme-tui/', 'project-two/', 'project-three/'],
    'dotfiles': ['hypr/', 'kitty/', 'nvim/', '.zshrc', 'README.md'],
    '.secrets': ['Permission denied.'],
};

export function ls(term, args) {
    const dir = args[0] ?? '~';
    const normalized = dir.replace(/\//g, '').replace('~', '~');

    const contents = tree[normalized] ?? tree['~'];
    term.writeln('');

    if (normalized === '.secrets') {
        term.writeln(`  \x1b[31mls: .secrets: Permission denied\x1b[0m`);
        term.writeln(`  ${C.dim}(nice try)${C.reset}`);
        term.writeln('');
        return;
    }

    for (const item of contents) {
        if (item.endsWith('/')) {
            term.writeln(`  ${C.blue}${C.bold}${item}${C.reset}`);
        } else {
            term.writeln(`  ${C.green}${item}${C.reset}`);
        }
    }
    term.writeln('');
}
