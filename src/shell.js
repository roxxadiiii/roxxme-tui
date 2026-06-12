import { printFastfetch } from './fastfetch.js';
import { help } from './commands/help.js';
import { linksCmd } from './commands/links.js';
import { about } from './commands/about.js';
import { projectsCmd } from './commands/projects.js';
import { contact } from './commands/contact.js';
import { themeCmd } from './commands/theme.js';
import { themes } from './themes.js';
import { displayCWD } from './filesystem.js';
import {
    ls, cd, pwd, cat, head, tail, wc, echo, grep, find,
    mkdir, touch, rm, cp, mv, dateCmd, cal, df, du,
    env, printenv, uname, whoami, id, hostname, uptime, free,
    ps, kill, sleep, yes, seq, sort, uniq, tr, cut, tee,
    basename, dirname, realpath, diff, stat, which, type,
    alias, historyCmd, man,
    trueCmd, falseCmd,
} from './commands/coreutils.js';

// ── Colours ────────────────────────────────────────────────
const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

// ── Dynamic prompt (updates after cd) ─────────────────────
const buildPrompt = () =>
    `${C.green}${C.bold}roxx${C.reset}${C.dim}@${C.reset}${C.cyan}archlinux${C.reset} ${C.yellow}${displayCWD()}${C.reset} ${C.bold}$${C.reset} `;

// ── Full command list for tab completion ───────────────────
const COMMANDS = [
    // custom
    'help', 'links', 'about', 'projects', 'contact', 'theme',
    'neofetch', 'fastfetch',
    // coreutils
    'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'wc', 'echo',
    'grep', 'find', 'mkdir', 'touch', 'rm', 'cp', 'mv',
    'date', 'cal', 'df', 'du', 'env', 'printenv',
    'uname', 'whoami', 'id', 'hostname', 'uptime', 'free',
    'ps', 'kill', 'sleep', 'yes', 'seq', 'sort', 'uniq',
    'tr', 'cut', 'tee', 'basename', 'dirname', 'realpath',
    'diff', 'stat', 'which', 'type', 'alias', 'history', 'man',
    'true', 'false',
    // easter eggs
    'sudo', 'vim', 'htop', 'clear', 'exit',
];

// ── Easter eggs (full-command-line matches) ────────────────
const easterEggs = {
    'sudo rm -rf /': `\x1b[31mnice try. i've seen this one before.\x1b[0m`,
    'sudo rm -rf /*': `\x1b[31mnice try. i've seen this one before.\x1b[0m`,
    'sudo': `\x1b[33m[sudo] password for roxx: \x1b[0m\r\nroxx is not in the sudoers file. this incident will be reported. ${C.dim}(it won't)${C.reset}`,
    'vim': `\x1b[32myou opened vim. good luck leaving.\x1b[0m\r\n${C.dim}(type :q! to quit, or live here forever)${C.reset}`,
    ':q!': `${C.green}left vim successfully. you are one of the chosen ones.${C.reset}`,
    ':wq': `${C.green}saved and quit. respect.${C.reset}`,
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

// ── Shell ──────────────────────────────────────────────────
export function createShell(term) {
    printFastfetch(term);
    term.writeln(`  ${C.dim}type ${C.reset}help${C.dim} to see available commands${C.reset}`);
    term.writeln('');

    let input = '';
    let history = [];
    let histIdx = -1;

    const writePrompt = () => term.write(buildPrompt());
    writePrompt();

    term.onKey(({ key, domEvent }) => {
        const code = domEvent.keyCode;

        // ── Enter ──────────────────────────────────────────────
        if (code === 13) {
            term.writeln('');
            const trimmed = input.trim();
            if (trimmed) {
                history.unshift(trimmed);
                histIdx = -1;
                runCommand(term, trimmed, history, writePrompt);
            }
            input = '';
            writePrompt();
            return;
        }

        // ── Backspace ──────────────────────────────────────────
        if (code === 8) {
            if (input.length > 0) { input = input.slice(0, -1); term.write('\b \b'); }
            return;
        }

        // ── Tab completion ─────────────────────────────────────
        if (code === 9) {
            domEvent.preventDefault();
            const parts = input.split(' ');
            const cmd = parts[0];
            const argPart = parts.slice(1).join(' ');

            // Context-aware: theme argument completion
            if (cmd === 'theme' && parts.length >= 2) {
                const themeKeys = Object.keys(themes);
                const matches = themeKeys.filter(k => k.startsWith(argPart) && k !== argPart);
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

            // Command completion (first token)
            if (parts.length === 1) {
                const matches = COMMANDS.filter(c => c.startsWith(cmd) && c !== cmd);
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
            }
            return;
        }

        // ── Arrow Up ───────────────────────────────────────────
        if (code === 38) {
            if (histIdx < history.length - 1) {
                histIdx++;
                clearInput(term, input);
                input = history[histIdx];
                term.write(input);
            }
            return;
        }

        // ── Arrow Down ─────────────────────────────────────────
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

        // ── Ctrl+C ─────────────────────────────────────────────
        if (domEvent.ctrlKey && domEvent.key === 'c') {
            term.writeln('^C');
            input = ''; histIdx = -1;
            writePrompt();
            return;
        }

        // ── Ctrl+L ─────────────────────────────────────────────
        if (domEvent.ctrlKey && domEvent.key === 'l') {
            term.clear(); input = ''; writePrompt();
            return;
        }

        // ── Printable ──────────────────────────────────────────
        if (!domEvent.ctrlKey && !domEvent.altKey && key.length === 1) {
            input += key;
            term.write(key);
        }
    });
}

// ── Clear current input on the line ───────────────────────
function clearInput(term, input) {
    for (let i = 0; i < input.length; i++) term.write('\b \b');
}

// ── Command router ─────────────────────────────────────────
function runCommand(term, raw, history, writePrompt) {
    const tokens = raw.trim().split(/\s+/);
    const cmd = tokens[0];
    const args = tokens.slice(1);

    // Easter egg exact-match check
    if (cmd in easterEggs || raw in easterEggs) {
        const key = raw in easterEggs ? raw : cmd;
        term.writeln('');
        term.writeln('  ' + easterEggs[key]);
        term.writeln('');
        return;
    }

    switch (cmd.toLowerCase()) {
        // ── custom ──────────────────────────────────────────────
        case 'help': help(term); break;
        case 'links': linksCmd(term); break;
        case 'about': about(term); break;
        case 'projects': projectsCmd(term); break;
        case 'contact': contact(term); break;
        case 'theme': themeCmd(term, args); break;
        case 'neofetch':
        case 'fastfetch': printFastfetch(term); break;
        case 'htop': term.writeln(''); term.writeln(htopFake()); term.writeln(''); break;

        // ── filesystem ──────────────────────────────────────────
        case 'ls': ls(term, args); break;
        case 'cd': cd(term, args); break;
        case 'pwd': pwd(term); break;
        case 'cat': cat(term, args); break;
        case 'head': head(term, args); break;
        case 'tail': tail(term, args); break;
        case 'mkdir': mkdir(term, args); break;
        case 'touch': touch(term, args); break;
        case 'rm': rm(term, args); break;
        case 'cp': cp(term, args); break;
        case 'mv': mv(term, args); break;
        case 'find': find(term, args); break;
        case 'stat': stat(term, args); break;
        case 'diff': diff(term, args); break;
        case 'realpath': realpath(term, args); break;
        case 'basename': basename(term, args); break;
        case 'dirname': dirname(term, args); break;

        // ── text processing ─────────────────────────────────────
        case 'wc': wc(term, args); break;
        case 'echo': echo(term, args); break;
        case 'grep': grep(term, args); break;
        case 'sort': sort(term, args); break;
        case 'uniq': uniq(term, args); break;
        case 'tr': tr(term, args); break;
        case 'cut': cut(term, args); break;
        case 'tee': tee(term); break;
        case 'seq': seq(term, args); break;

        // ── system info ─────────────────────────────────────────
        case 'date': dateCmd(term, args); break;
        case 'cal': cal(term); break;
        case 'df': df(term, args); break;
        case 'du': du(term, args); break;
        case 'env': env(term); break;
        case 'printenv': printenv(term, args); break;
        case 'uname': uname(term, args); break;
        case 'whoami': whoami(term); break;
        case 'id': id(term); break;
        case 'hostname': hostname(term); break;
        case 'uptime': uptime(term); break;
        case 'free': free(term, args); break;
        case 'ps': ps(term, args); break;
        case 'kill': kill(term, args); break;

        // ── misc ────────────────────────────────────────────────
        case 'sleep': sleep(term, args); break;
        case 'yes': yes(term, args); break;
        case 'true': trueCmd(term); break;
        case 'false': falseCmd(term); break;
        case 'which': which(term, args); break;
        case 'type': type(term, args); break;
        case 'alias': alias(term, args); break;
        case 'history': historyCmd(term, history); break;
        case 'man': man(term, args); break;

        // ── shell builtins ──────────────────────────────────────
        case 'clear':
            term.clear();
            break;

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
