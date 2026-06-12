// ── Catppuccin Mocha palette shortcuts ────────────────────
const C = {
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
};

// ── ASCII art (Arch logo, simple) ─────────────────────────
const logo = [
    `${C.cyan}       /\\       ${C.reset}`,
    `${C.cyan}      /  \\      ${C.reset}`,
    `${C.cyan}     /\\   \\     ${C.reset}`,
    `${C.cyan}    /  __  \\    ${C.reset}`,
    `${C.cyan}   /  (  )  \\   ${C.reset}`,
    `${C.cyan}  / __|  |__ \\  ${C.reset}`,
    `${C.cyan} /_.'\`  \`'._\\ ${C.reset}`,
];

// ── Info rows ──────────────────────────────────────────────
const info = [
    `${C.cyan}${C.bold}roxx${C.reset}${C.white}@${C.reset}${C.cyan}${C.bold}archlinux${C.reset}`,
    `${C.dim}──────────────────────────────${C.reset}`,
    `${C.blue}OS${C.reset}        Arch Linux ${C.dim}(btw)${C.reset}`,
    `${C.blue}Kernel${C.reset}    6.9.1-arch1-1 ${C.dim}(kernel panic speedrun any%)${C.reset}`,
    `${C.blue}Shell${C.reset}     zsh ${C.dim}(bash is for people who don't rice)${C.reset}`,
    `${C.blue}WM${C.reset}        Hyprland ${C.dim}(took 3 days to configure, worth it)${C.reset}`,
    `${C.blue}Terminal${C.reset}  kitty ${C.dim}(it's fast, unlike my deadlines)${C.reset}`,
    `${C.blue}Editor${C.reset}    neovim ${C.dim}(i've transcended IDEs)${C.reset}`,
    `${C.blue}Uptime${C.reset}    6h 42m ${C.dim}(last broke it updating grub)${C.reset}`,
    `${C.blue}Packages${C.reset}  1337 ${C.dim}(yes i counted, yes i need them all)${C.reset}`,
    `${C.blue}Memory${C.reset}    4.2 GiB / 16 GiB ${C.dim}(the rest is vim swap files)${C.reset}`,
    `${C.blue}CPU${C.reset}       too fast for your basic distro`,
    ``,
    palette(),
];

function palette() {
    const blocks = ['▓', '▓', '▓', '▓', '▓', '▓', '▓', '▓'];
    const colors = [30, 31, 32, 33, 34, 35, 36, 37];
    return blocks.map((b, i) => `\x1b[${colors[i]}m${b}${C.reset}`).join('');
}

// ── Render ─────────────────────────────────────────────────
export function printFastfetch(term) {
    const height = Math.max(logo.length, info.length);

    for (let i = 0; i < height; i++) {
        const left = logo[i] ?? '               ';
        const right = info[i] ?? '';
        term.writeln(`  ${left}  ${right}`);
    }
    term.writeln('');
}
