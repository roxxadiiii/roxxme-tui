// ── Colours (ANSI escape helpers) ─────────────────────────
const c = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

const ok = `${c.green}[  OK  ]${c.reset}`;
const warn = `${c.yellow}[ WARN ]${c.reset}`;
const fail = `${c.yellow}[ FAIL ]${c.reset}`;  // not really failing, just drama

// ── Fake boot log lines ────────────────────────────────────
const bootLines = [
    `${c.dim}BIOS v2.69 — "yes i rice my BIOS too"${c.reset}`,
    ``,
    `${c.cyan}${c.bold}roxxme-os 6.9.1-arch1-1 booting...${c.reset}`,
    ``,
    `${ok} Started ${c.white}udev Kernel Device Manager${c.reset}`,
    `${ok} Reached target ${c.white}Local File Systems${c.reset}`,
    `${ok} Started ${c.white}NetworkManager${c.reset}`,
    `${ok} Started ${c.white}D-Bus System Message Bus${c.reset} (nobody asked)`,
    `${warn} Skipped ${c.white}systemd-boot${c.reset} (i use GRUB, fight me)`,
    `${ok} Started ${c.white}Hyprland Compositor${c.reset} (the good stuff)`,
    `${ok} Started ${c.white}kitty terminal emulator${c.reset}`,
    `${fail} Failed to start ${c.white}social life${c.reset} (unit not found)`,
    `${ok} Started ${c.white}btop${c.reset} (watching RAM go brrr)`,
    `${ok} Reached target ${c.white}Multi-User System${c.reset}`,
    `${ok} Reached target ${c.white}Graphical Interface${c.reset}`,
    ``,
    `${c.dim}Arch Linux — btw${c.reset}`,
    ``,
];

// ── Helpers ────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const writeLine = (term, line) => {
    term.writeln(line);
};

// ── Boot sequence ──────────────────────────────────────────
export async function boot(term) {
    term.clear();

    for (const line of bootLines) {
        writeLine(term, line);
        await sleep(55 + Math.random() * 60);
    }

    await sleep(400);

    // login prompt
    term.write(`${c.white}roxx${c.reset}@${c.cyan}archlinux${c.reset} login: `);
    await sleep(600);
    term.writeln(`${c.green}roxx${c.reset}`);
    await sleep(200);
    term.write(`Password: `);
    await sleep(500);
    term.writeln('');        // password hidden, obviously
    await sleep(300);
    term.writeln(`${c.green}Last login:${c.reset} never, this is literally a website`);
    term.writeln('');
    await sleep(400);
}
