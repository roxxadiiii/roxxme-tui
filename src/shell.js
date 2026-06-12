import { printFastfetch } from './fastfetch.js';
import { help } from './commands/help.js';
import { linksCmd } from './commands/links.js';
import { about } from './commands/about.js';
import { projectsCmd } from './commands/projects.js';
import { contact } from './commands/contact.js';
import { ls } from './commands/ls.js';
import { themeCmd } from './commands/theme.js';
import { themes } from './themes.js';

// ── Colour helpers ─────────────────────────────────────────
const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

const PROMPT = `${C.green}${C.bold}roxx${C.reset}${C.dim}@${C.reset}${C.cyan}archlinux${C.reset} ${C.dim}~${C.reset} ${C.bold}$${C.reset} `;

// ── All known command names (for tab completion) ───────────
const COMMANDS = [
    'help', 'links', 'about', 'projects', 'contact',
    'neofetch', 'ls', 'theme', 'clear', 'exit', 'sudo', 'vim',
    'cat', 'htop', 'uname',
];

// ── Easter eggs ────────────────────────────────────────────
const easterEggs = {
    'sudo rm -rf /': `\x1b[31mnice try. i've seen this one before.\x1b[0m`,
    'sudo rm -rf /*': `\x1b[31mnice try. i've seen this one before.\x1b[0m`,
    'sudo': `\x1b[33m[sudo] password for roxx: \x1b[0m\r\nroxx is not in the sudoers file. this incident will be reported. ${C.dim}(it won't)${C.reset}`,
    'vim': `\x1b[32myou opened vim. good luck leaving.\x1b[0m\r\n${C.dim}(type :q! to quit, or live here forever)${C.reset}`,
    ':q!': `${C.green}left vim successfully. you are one of the chosen ones.${C.reset}`,
    ':wq': `${C.green}saved and quit. respect.${C.reset}`,
    'htop': htopFake(),
    'uname -a': `Linux archlinux 6.9.1-arch1-1 #1 SMP PREEMPT_DYNAMIC roxx@archlinux x86_64 GNU/Linux`,
    'uname': `Linux`,
    'cat /etc/os-release': `NAME="Arch Linux"\nPRETTY_NAME="Arch Linux"\nID=arch\nBUILD_ID=rolling\nHOME_URL="https://archlinux.org/"\nSUPPORT_URL="https://bbs.archlinux.org/"\n${C.dim}(i use arch btw)${C.reset}`,
    'cat about.txt': null,   // handled below
    'uptime': `up 6:42, 1 user, load average: 0.42, 0.13, 0.69`,
    'whoami': `roxx ${C.dim}(the one and only)${C.reset}`,
    'pwd': `/home/roxx`,
    'date': new Date().toString(),
};

function htopFake() {
    return [
        ``,
        `  ${C.green}CPU${C.reset} [|||||||||||||||||||||||||||||||   42%]`,
        `  ${C.green}MEM${C.reset} [|||||||||||||||||||||            4.2G/16G]`,
        ``,
        `  ${C.dim}PID   USER    PRI  NI  VIRT   RES   CPU%  MEM%  TIME+   CMD${C.reset}`,
        `  1337  roxx    20   0  512M   64M   12.5   0.4  9:42.00  neovim (not responding)`,
        `  420   roxx    20   0  256M   32M    8.3   0.2  4:20.00  hyprland`,
        `  69    roxx    20   0  128M   16M    1.2   0.1  0:00.69  btop`,
        `  1     root    20   0   32M    4M    0.1   0.0  0:00.01  systemd (just vibing)`,
        ``,
        `  ${C.dim}press q to quit (this does nothing, it's a website)${C.reset}`,
        ``,
    ].join('\r\n');
}

// ── Shell factory ──────────────────────────────────────────
export function createShell(term) {
    // print fastfetch first
    printFastfetch(term);
    term.writeln(`  ${C.dim}type ${C.reset}help${C.dim} to see available commands${C.reset}`);
    term.writeln('');

    let input = '';
    let history = [];
    let histIdx = -1;

    const writePrompt = () => term.write(PROMPT);
    writePrompt();

    term.onKey(({ key, domEvent }) => {
        const code = domEvent.keyCode;

        // ── Enter ────────────────────────────────────────────
        if (code === 13) {
            term.writeln('');
            const trimmed = input.trim();
            if (trimmed) {
                history.unshift(trimmed);
                histIdx = -1;
                runCommand(term, trimmed);
            }
            input = '';
            writePrompt();
            return;
        }

        // ── Backspace ────────────────────────────────────────
        if (code === 8) {
            if (input.length > 0) {
                input = input.slice(0, -1);
                term.write('\b \b');
            }
            return;
        }

        // ── Tab completion ───────────────────────────────────
        if (code === 9) {
            domEvent.preventDefault();
            const parts = input.split(' ');
            const cmd = parts[0];
            const argPart = parts.slice(1).join(' ');

            // ── Argument completion: theme <name> ────────────
            if (cmd === 'theme' && parts.length >= 2) {
                const themeKeys = Object.keys(themes);
                const matches = themeKeys.filter((k) => k.startsWith(argPart) && k !== argPart);

                if (matches.length === 1) {
                    const completion = matches[0].slice(argPart.length);
                    input += completion;
                    term.write(completion);
                } else if (matches.length > 1) {
                    term.writeln('');
                    term.writeln('  ' + matches.join('  '));
                    writePrompt();
                    term.write(input);
                }
                return;
            }

            // ── Command completion ───────────────────────────
            const matches = COMMANDS.filter((c) => c.startsWith(cmd) && c !== cmd);
            if (matches.length === 1) {
                const completion = matches[0].slice(cmd.length);
                input += completion;
                term.write(completion);
            } else if (matches.length > 1) {
                term.writeln('');
                term.writeln('  ' + matches.join('  '));
                writePrompt();
                term.write(input);
            }
            return;
        }

        // ── Arrow Up (history) ───────────────────────────────
        if (code === 38) {
            if (histIdx < history.length - 1) {
                histIdx++;
                clearInput(term, input);
                input = history[histIdx];
                term.write(input);
            }
            return;
        }

        // ── Arrow Down (history) ─────────────────────────────
        if (code === 40) {
            if (histIdx > 0) {
                histIdx--;
                clearInput(term, input);
                input = history[histIdx];
                term.write(input);
            } else if (histIdx === 0) {
                histIdx = -1;
                clearInput(term, input);
                input = '';
            }
            return;
        }

        // ── Ctrl+C ───────────────────────────────────────────
        if (domEvent.ctrlKey && domEvent.key === 'c') {
            term.writeln('^C');
            input = '';
            histIdx = -1;
            writePrompt();
            return;
        }

        // ── Ctrl+L ───────────────────────────────────────────
        if (domEvent.ctrlKey && domEvent.key === 'l') {
            term.clear();
            input = '';
            writePrompt();
            return;
        }

        // ── Printable characters ─────────────────────────────
        if (!domEvent.ctrlKey && !domEvent.altKey && key.length === 1) {
            input += key;
            term.write(key);
        }
    });
}

// ── Clear current input line ───────────────────────────────
function clearInput(term, input) {
    for (let i = 0; i < input.length; i++) term.write('\b \b');
}

// ── Command router ─────────────────────────────────────────
function runCommand(term, raw) {
    const [cmd, ...args] = raw.split(' ');

    // check easter eggs first (full raw match)
    if (easterEggs[raw] !== undefined) {
        const val = easterEggs[raw];
        if (val !== null) { term.writeln('  ' + val); term.writeln(''); }
        else { about(term); }   // cat about.txt → about
        return;
    }

    switch (cmd.toLowerCase()) {
        case 'help': help(term); break;
        case 'links': linksCmd(term); break;
        case 'about': about(term); break;
        case 'projects': projectsCmd(term); break;
        case 'contact': contact(term); break;
        case 'neofetch':
        case 'fastfetch': printFastfetch(term); break;
        case 'ls': ls(term, args); break;
        case 'theme': themeCmd(term, args); break;
        case 'clear': term.clear(); break;
        case 'exit':
            term.writeln('');
            term.writeln(`  ${C.yellow}closing tab won't delete your browsing history.${C.reset}`);
            term.writeln(`  ${C.dim}(this is a website, you can't really exit)${C.reset}`);
            term.writeln('');
            break;

        default:
            term.writeln('');
            term.writeln(`  ${C.red}command not found: ${cmd}${C.reset}  ${C.dim}(did you mean to install it from the AUR?)${C.reset}`);
            term.writeln(`  ${C.dim}type 'help' for available commands${C.reset}`);
            term.writeln('');
    }
}
