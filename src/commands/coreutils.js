import { resolvePath, getNode, nodeType, CWD, setCWD, displayCWD, FS } from '../filesystem.js';

const R = '\x1b[0m';
const B = '\x1b[34m';   // blue  (dirs)
const G = '\x1b[32m';   // green (files / ok)
const Y = '\x1b[33m';   // yellow
const C = '\x1b[36m';   // cyan
const RE = '\x1b[31m';  // red   (errors)
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

// ── helpers ────────────────────────────────────────────────
function err(term, msg) {
    term.writeln(`${RE}${msg}${R}`);
}

function isDir(node) { return node !== null && typeof node === 'object'; }
function isFile(node) { return typeof node === 'string'; }

// ── ls ─────────────────────────────────────────────────────
export function ls(term, args) {
    const flags = args.filter(a => a.startsWith('-'));
    const paths = args.filter(a => !a.startsWith('-'));
    const showAll = flags.some(f => f.includes('a'));
    const longFmt = flags.some(f => f.includes('l'));
    const target = resolvePath(paths[0] ?? '');
    const type = nodeType(target);

    term.writeln('');

    if (type === 'denied') {
        err(term, `ls: ${paths[0] ?? target}: Permission denied`);
        term.writeln('');
        return;
    }
    if (type === null) {
        err(term, `ls: cannot access '${paths[0]}': No such file or directory`);
        term.writeln('');
        return;
    }
    if (type === 'file') {
        term.writeln(`  ${G}${target.split('/').pop()}${R}`);
        term.writeln('');
        return;
    }

    const node = getNode(target);
    const entries = Object.keys(node).filter(k => showAll || !k.startsWith('.'));

    if (longFmt) {
        const now = new Date();
        const mo = now.toLocaleString('en', { month: 'short' });
        const dy = String(now.getDate()).padStart(2);
        for (const name of entries) {
            const child = node[name];
            const isD = isDir(child);
            const perm = isD ? 'drwxr-xr-x' : '-rw-r--r--';
            const size = isFile(child) ? String(child.length).padStart(6) : '  4096';
            const color = isD ? B + BOLD : G;
            const slash = isD ? '/' : '';
            term.writeln(`  ${DIM}${perm}  1 roxx roxx ${size} ${mo} ${dy}${R}  ${color}${name}${slash}${R}`);
        }
    } else {
        // grid layout
        const row = [];
        for (const name of entries) {
            const child = node[name];
            const isD = isDir(child);
            const color = isD ? B + BOLD : G;
            const slash = isD ? '/' : '';
            row.push(`${color}${name}${slash}${R}`);
        }
        // print 4 per row (approx)
        for (let i = 0; i < row.length; i += 4) {
            term.writeln('  ' + row.slice(i, i + 4).map(s => padAnsi(s, 22)).join(''));
        }
    }
    term.writeln('');
}

// ── cd ─────────────────────────────────────────────────────
export function cd(term, args, updatePrompt) {
    const target = resolvePath(args[0] ?? '~');
    const type = nodeType(target);

    if (type === 'denied') { err(term, `cd: ${args[0]}: Permission denied`); term.writeln(''); return; }
    if (type === null) { err(term, `cd: ${args[0]}: No such file or directory`); term.writeln(''); return; }
    if (type === 'file') { err(term, `cd: ${args[0]}: Not a directory`); term.writeln(''); return; }

    setCWD(target);
    updatePrompt();   // signal shell to redraw prompt
}

// ── pwd ────────────────────────────────────────────────────
export function pwd(term) {
    term.writeln('');
    term.writeln(`  ${CWD}`);
    term.writeln('');
}

// ── cat ────────────────────────────────────────────────────
export function cat(term, args) {
    if (!args.length) { err(term, 'cat: missing operand'); term.writeln(''); return; }

    for (const arg of args) {
        const target = resolvePath(arg);
        const type = nodeType(target);

        term.writeln('');
        if (type === 'denied') { err(term, `cat: ${arg}: Permission denied`); term.writeln(''); continue; }
        if (type === null) { err(term, `cat: ${arg}: No such file or directory`); term.writeln(''); continue; }
        if (type === 'dir') { err(term, `cat: ${arg}: Is a directory`); term.writeln(''); continue; }

        const content = getNode(target);
        for (const line of content.split('\n')) {
            term.writeln('  ' + line);
        }
        term.writeln('');
    }
}

// ── head ───────────────────────────────────────────────────
export function head(term, args) {
    const { files, n } = parseNFlag(args, 10);
    if (!files.length) { err(term, 'head: missing operand'); term.writeln(''); return; }

    for (const arg of files) {
        const target = resolvePath(arg);
        const type = nodeType(target);

        term.writeln('');
        if (type !== 'file') { fileErr(term, 'head', arg, type); continue; }
        const lines = getNode(target).split('\n').slice(0, n);
        if (files.length > 1) term.writeln(`  ${DIM}==> ${arg} <==${R}`);
        for (const l of lines) term.writeln('  ' + l);
        term.writeln('');
    }
}

// ── tail ───────────────────────────────────────────────────
export function tail(term, args) {
    const { files, n } = parseNFlag(args, 10);
    if (!files.length) { err(term, 'tail: missing operand'); term.writeln(''); return; }

    for (const arg of files) {
        const target = resolvePath(arg);
        const type = nodeType(target);

        term.writeln('');
        if (type !== 'file') { fileErr(term, 'tail', arg, type); continue; }
        const content = getNode(target).split('\n');
        const lines = content.slice(-n);
        if (files.length > 1) term.writeln(`  ${DIM}==> ${arg} <==${R}`);
        for (const l of lines) term.writeln('  ' + l);
        term.writeln('');
    }
}

// ── wc ─────────────────────────────────────────────────────
export function wc(term, args) {
    const flags = args.filter(a => a.startsWith('-'));
    const files = args.filter(a => !a.startsWith('-'));
    const wFlag = flags.some(f => f.includes('w'));
    const cFlag = flags.some(f => f.includes('c'));
    const lFlag = flags.some(f => f.includes('l'));
    const allFlags = !wFlag && !cFlag && !lFlag; // default: show all

    if (!files.length) { err(term, 'wc: missing operand'); term.writeln(''); return; }

    term.writeln('');
    let totL = 0, totW = 0, totC = 0;

    for (const arg of files) {
        const target = resolvePath(arg);
        const type = nodeType(target);
        if (type !== 'file') { fileErr(term, 'wc', arg, type); continue; }

        const content = getNode(target);
        const lines = content.split('\n').length;
        const words = content.trim().split(/\s+/).length;
        const chars = content.length;
        totL += lines; totW += words; totC += chars;

        let out = '  ';
        if (allFlags || lFlag) out += String(lines).padStart(4) + ' ';
        if (allFlags || wFlag) out += String(words).padStart(4) + ' ';
        if (allFlags || cFlag) out += String(chars).padStart(6) + ' ';
        out += `${DIM}${arg}${R}`;
        term.writeln(out);
    }

    if (files.length > 1) {
        let tot = '  ';
        if (allFlags || lFlag) tot += String(totL).padStart(4) + ' ';
        if (allFlags || wFlag) tot += String(totW).padStart(4) + ' ';
        if (allFlags || cFlag) tot += String(totC).padStart(6) + ' ';
        tot += `${DIM}total${R}`;
        term.writeln(tot);
    }
    term.writeln('');
}

// ── echo ───────────────────────────────────────────────────
export function echo(term, args) {
    const noNewline = args[0] === '-n';
    const text = (noNewline ? args.slice(1) : args).join(' ')
        .replace(/\\n/g, '\r\n')
        .replace(/\\t/g, '\t');
    term.writeln('');
    term.writeln('  ' + text);
    if (!noNewline) term.writeln('');
}

// ── grep ───────────────────────────────────────────────────
export function grep(term, args) {
    const flags = args.filter(a => a.startsWith('-'));
    const rest = args.filter(a => !a.startsWith('-'));
    const iFlag = flags.some(f => f.includes('i'));
    const nFlag = flags.some(f => f.includes('n'));
    const vFlag = flags.some(f => f.includes('v'));  // invert
    const pattern = rest[0];
    const files = rest.slice(1);

    if (!pattern) { err(term, 'grep: missing pattern'); term.writeln(''); return; }

    term.writeln('');

    for (const arg of files) {
        const target = resolvePath(arg);
        const type = nodeType(target);
        if (type !== 'file') { fileErr(term, 'grep', arg, type); continue; }

        const content = getNode(target).split('\n');
        const regex = new RegExp(pattern, iFlag ? 'gi' : 'g');
        let matched = false;

        content.forEach((line, idx) => {
            const matches = regex.test(line);
            regex.lastIndex = 0;
            if (vFlag ? !matches : matches) {
                matched = true;
                const prefix = files.length > 1 ? `${C}${arg}${R}:` : '';
                const lineNo = nFlag ? `${Y}${idx + 1}${R}:` : '';
                // highlight match
                const highlighted = line.replace(regex, m => `${RE}${BOLD}${m}${R}`);
                regex.lastIndex = 0;
                term.writeln(`  ${prefix}${lineNo}${highlighted}`);
            }
        });

        if (!matched && !vFlag) {
            // no output = no match (like real grep)
        }
    }
    term.writeln('');
}

// ── find ───────────────────────────────────────────────────
export function find(term, args) {
    const startArg = args.find(a => !a.startsWith('-') && args.indexOf(a) === 0) ?? '.';
    const nameIdx = args.indexOf('-name');
    const nameGlob = nameIdx !== -1 ? args[nameIdx + 1] : null;
    const typeIdx = args.indexOf('-type');
    const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : null;  // f or d

    const start = resolvePath(startArg);
    const results = [];
    walkFS(start, start, results);

    term.writeln('');

    for (const p of results) {
        const type = nodeType(p);
        if (typeFilter === 'f' && type !== 'file') continue;
        if (typeFilter === 'd' && type !== 'dir') continue;
        if (nameGlob) {
            const name = p.split('/').pop();
            const pattern = nameGlob.replace(/\*/g, '.*').replace(/\?/g, '.');
            if (!new RegExp(`^${pattern}$`).test(name)) continue;
        }
        const display = p.replace('/home/roxx', '~');
        const color = type === 'dir' ? B + BOLD : G;
        term.writeln(`  ${color}${display}${R}`);
    }
    term.writeln('');
}

function walkFS(base, current, out) {
    out.push(current);
    const node = getNode(current);
    if (!isDir(node)) return;
    for (const key of Object.keys(node)) {
        const child = current === '/' ? `/${key}` : `${current}/${key}`;
        walkFS(base, child, out);
    }
}

// ── mkdir ──────────────────────────────────────────────────
export function mkdir(term, args) {
    if (!args.length) { err(term, 'mkdir: missing operand'); term.writeln(''); return; }
    // in a fake FS we just acknowledge it (read-only world)
    term.writeln('');
    for (const arg of args) {
        term.writeln(`  ${DIM}mkdir: created directory '${arg}'${R}  ${DIM}(gone when you refresh)${R}`);
    }
    term.writeln('');
}

// ── touch ──────────────────────────────────────────────────
export function touch(term, args) {
    if (!args.length) { err(term, 'touch: missing file operand'); term.writeln(''); return; }
    term.writeln('');
    for (const arg of args) {
        term.writeln(`  ${DIM}touch: '${arg}' updated  (ephemeral, like all things)${R}`);
    }
    term.writeln('');
}

// ── rm ─────────────────────────────────────────────────────
export function rm(term, args) {
    const files = args.filter(a => !a.startsWith('-'));
    if (!files.length) { err(term, 'rm: missing operand'); term.writeln(''); return; }
    term.writeln('');
    // allow drama for special paths
    if (files.some(f => f === '/' || f === '-rf' || f === '-rf /')) {
        term.writeln(`  ${RE}rm: it is dangerous to operate recursively on '/'${R}`);
        term.writeln(`  ${DIM}nice try though${R}`);
    } else {
        for (const f of files) {
            term.writeln(`  ${DIM}rm: removed '${f}'  (in your dreams)${R}`);
        }
    }
    term.writeln('');
}

// ── cp ─────────────────────────────────────────────────────
export function cp(term, args) {
    const files = args.filter(a => !a.startsWith('-'));
    if (files.length < 2) { err(term, 'cp: missing destination file operand'); term.writeln(''); return; }
    const [src, ...dests] = files;
    term.writeln('');
    term.writeln(`  ${DIM}cp: '${src}' → '${dests.join("', '")}' (pretend it worked)${R}`);
    term.writeln('');
}

// ── mv ─────────────────────────────────────────────────────
export function mv(term, args) {
    const files = args.filter(a => !a.startsWith('-'));
    if (files.length < 2) { err(term, 'mv: missing destination file operand'); term.writeln(''); return; }
    const [src, dest] = files;
    term.writeln('');
    term.writeln(`  ${DIM}mv: '${src}' → '${dest}' (sure, why not)${R}`);
    term.writeln('');
}

// ── date ───────────────────────────────────────────────────
export function dateCmd(term, args) {
    term.writeln('');
    const now = new Date();
    if (args.includes('+%s')) {
        term.writeln('  ' + Math.floor(now.getTime() / 1000));
    } else if (args.some(a => a.startsWith('+'))) {
        const fmt = args.find(a => a.startsWith('+')).slice(1);
        term.writeln('  ' + formatDate(now, fmt));
    } else {
        term.writeln('  ' + now.toString());
    }
    term.writeln('');
}

function formatDate(d, fmt) {
    return fmt
        .replace('%Y', d.getFullYear())
        .replace('%m', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('%d', String(d.getDate()).padStart(2, '0'))
        .replace('%H', String(d.getHours()).padStart(2, '0'))
        .replace('%M', String(d.getMinutes()).padStart(2, '0'))
        .replace('%S', String(d.getSeconds()).padStart(2, '0'))
        .replace('%A', d.toLocaleString('en', { weekday: 'long' }))
        .replace('%B', d.toLocaleString('en', { month: 'long' }));
}

// ── cal ────────────────────────────────────────────────────
export function cal(term) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleString('en', { month: 'long' });

    term.writeln('');
    term.writeln(`  ${BOLD}     ${monthName} ${year}${R}`);
    term.writeln(`  ${DIM}Su Mo Tu We Th Fr Sa${R}`);

    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    let line = '  ' + '   '.repeat(first);
    for (let d = 1; d <= days; d++) {
        const isToday = d === now.getDate();
        const cell = String(d).padStart(2);
        line += isToday ? `${Y}${BOLD}${cell}${R} ` : `${cell} `;
        if ((first + d) % 7 === 0) { term.writeln(line); line = '  '; }
    }
    if (line.trim()) term.writeln(line);
    term.writeln('');
}

// ── df ─────────────────────────────────────────────────────
export function df(term, args) {
    const human = args.includes('-h');
    term.writeln('');
    term.writeln(`  ${DIM}Filesystem      Size   Used  Avail Use% Mounted on${R}`);
    const rows = [
        ['/dev/nvme0n1p2', '100G', '42G', '58G', '43%', '/'],
        ['/dev/nvme0n1p1', '512M', '128M', '384M', '25%', '/boot'],
        ['tmpfs', '8.0G', '1.2G', '6.8G', '15%', '/tmp'],
    ];
    for (const [fs, size, used, avail, pct, mnt] of rows) {
        term.writeln(`  ${G}${fs.padEnd(16)}${R}${size.padStart(5)}  ${used.padStart(4)}  ${avail.padStart(5)}  ${Y}${pct.padStart(4)}${R}  ${C}${mnt}${R}`);
    }
    term.writeln('');
}

// ── du ─────────────────────────────────────────────────────
export function du(term, args) {
    const paths = args.filter(a => !a.startsWith('-'));
    const target = resolvePath(paths[0] ?? '');
    term.writeln('');

    const results = [];
    walkFS(target, target, results);
    for (const p of results.slice(0, 20)) {
        const size = Math.floor(Math.random() * 500 + 4);
        const display = p.replace('/home/roxx', '~');
        term.writeln(`  ${DIM}${String(size).padStart(4)}${R}\t${display}`);
    }
    term.writeln('');
}

// ── env ────────────────────────────────────────────────────
export function env(term) {
    const vars = [
        ['USER', 'roxx'],
        ['HOME', '/home/roxx'],
        ['SHELL', '/usr/bin/zsh'],
        ['TERM', 'xterm-256color'],
        ['EDITOR', 'nvim'],
        ['VISUAL', 'nvim'],
        ['PAGER', 'less'],
        ['LANG', 'en_US.UTF-8'],
        ['XDG_SESSION_TYPE', 'wayland'],
        ['WAYLAND_DISPLAY', 'wayland-1'],
        ['HYPRLAND_INSTANCE_SIGNATURE', 'yes-i-use-hyprland'],
        ['PATH', '/usr/local/bin:/usr/bin:/bin:/home/roxx/.local/bin'],
        ['_', '/usr/bin/env'],
    ];
    term.writeln('');
    for (const [k, v] of vars) {
        term.writeln(`  ${C}${k}${R}=${v}`);
    }
    term.writeln('');
}

// ── printenv ───────────────────────────────────────────────
export function printenv(term, args) {
    const envMap = {
        USER: 'roxx', HOME: '/home/roxx', SHELL: '/usr/bin/zsh',
        TERM: 'xterm-256color', EDITOR: 'nvim', LANG: 'en_US.UTF-8',
        PATH: '/usr/local/bin:/usr/bin:/bin',
    };
    term.writeln('');
    if (args.length) {
        for (const k of args) {
            if (k in envMap) term.writeln(`  ${envMap[k]}`);
            else err(term, `printenv: ${k}: No such environment variable`);
        }
    } else {
        for (const [k, v] of Object.entries(envMap)) term.writeln(`  ${C}${k}${R}=${v}`);
    }
    term.writeln('');
}

// ── uname ──────────────────────────────────────────────────
export function uname(term, args) {
    term.writeln('');
    if (!args.length || args.includes('-s')) { term.writeln('  Linux'); }
    else if (args.includes('-a')) {
        term.writeln('  Linux archlinux 6.9.1-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
    } else if (args.includes('-r')) { term.writeln('  6.9.1-arch1-1'); }
    else if (args.includes('-m')) { term.writeln('  x86_64'); }
    else if (args.includes('-n')) { term.writeln('  archlinux'); }
    else { term.writeln('  Linux'); }
    term.writeln('');
}

// ── whoami ─────────────────────────────────────────────────
export function whoami(term) {
    term.writeln('');
    term.writeln(`  roxx  ${DIM}(the one and only)${R}`);
    term.writeln('');
}

// ── id ─────────────────────────────────────────────────────
export function id(term) {
    term.writeln('');
    term.writeln(`  uid=1000(roxx) gid=1000(roxx) groups=1000(roxx),998(wheel),985(users),991(lp),998(audio),996(video)`);
    term.writeln('');
}

// ── hostname ───────────────────────────────────────────────
export function hostname(term) {
    term.writeln('');
    term.writeln('  archlinux');
    term.writeln('');
}

// ── uptime ─────────────────────────────────────────────────
export function uptime(term) {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    term.writeln('');
    term.writeln(`  ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}  up 6:42,  1 user,  load average: 0.42, 0.13, 0.69  ${DIM}(last broke it updating grub)${R}`);
    term.writeln('');
}

// ── free ───────────────────────────────────────────────────
export function free(term, args) {
    const human = args.includes('-h');
    term.writeln('');
    term.writeln(`  ${DIM}               total        used        free      shared  buff/cache   available${R}`);
    term.writeln(`  ${G}Mem:${R}           16384M      4200M      8192M        512M      3990M     10240M`);
    term.writeln(`  ${G}Swap:${R}           8192M         0M      8192M`);
    term.writeln(`  ${DIM}(you have plenty of RAM. install more packages.)${R}`);
    term.writeln('');
}

// ── ps ─────────────────────────────────────────────────────
export function ps(term, args) {
    term.writeln('');
    term.writeln(`  ${DIM}  PID TTY          TIME CMD${R}`);
    const procs = [
        ['1337', 'pts/0', '00:09:42', 'nvim'],
        ['420', 'pts/0', '00:04:20', 'zsh'],
        ['69', 'pts/1', '00:00:42', 'kitty'],
        ['1', '?', '00:00:01', 'systemd'],
        ['2', '?', '00:00:00', 'hyprland'],
    ];
    for (const [pid, tty, time, cmd] of procs) {
        term.writeln(`  ${pid.padStart(5)}  ${tty.padEnd(10)} ${time}  ${G}${cmd}${R}`);
    }
    term.writeln('');
}

// ── kill ───────────────────────────────────────────────────
export function kill(term, args) {
    const pid = args[0];
    if (!pid) { err(term, 'kill: usage: kill <pid>'); term.writeln(''); return; }
    term.writeln('');
    if (pid === '1337') {
        term.writeln(`  ${RE}kill: (1337) nvim refuses to die. it lives forever.${R}`);
    } else {
        term.writeln(`  ${DIM}kill: sent signal to process ${pid}. probably fine.${R}`);
    }
    term.writeln('');
}

// ── sleep ──────────────────────────────────────────────────
export function sleep(term, args) {
    const secs = parseFloat(args[0]);
    if (isNaN(secs)) { err(term, `sleep: invalid time interval '${args[0]}'`); term.writeln(''); return; }
    term.writeln('');
    term.writeln(`  ${DIM}sleeping for ${secs}s... (in your imagination)${R}`);
    term.writeln('');
}

// ── true / false ───────────────────────────────────────────
export function trueCmd(term) { /* exits 0, no output */ }
export function falseCmd(term) { /* exits 1, no output */ }

// ── yes ────────────────────────────────────────────────────
export function yes(term, args) {
    const word = args[0] ?? 'y';
    term.writeln('');
    for (let i = 0; i < 8; i++) term.writeln(`  ${word}`);
    term.writeln(`  ${DIM}... (stops here. this is a website.)${R}`);
    term.writeln('');
}

// ── seq ────────────────────────────────────────────────────
export function seq(term, args) {
    let first = 1, inc = 1, last;
    if (args.length === 1) { last = parseInt(args[0]); }
    else if (args.length === 2) { first = parseInt(args[0]); last = parseInt(args[1]); }
    else { first = parseInt(args[0]); inc = parseInt(args[1]); last = parseInt(args[2]); }

    if (isNaN(first) || isNaN(last)) { err(term, 'seq: invalid argument'); term.writeln(''); return; }
    term.writeln('');
    const cap = 50;  // don't flood the terminal
    let count = 0;
    for (let i = first; inc > 0 ? i <= last : i >= last; i += inc) {
        term.writeln('  ' + i);
        if (++count >= cap) { term.writeln(`  ${DIM}... (capped at ${cap} lines)${R}`); break; }
    }
    term.writeln('');
}

// ── sort ───────────────────────────────────────────────────
export function sort(term, args) {
    const flags = args.filter(a => a.startsWith('-'));
    const files = args.filter(a => !a.startsWith('-'));
    const rev = flags.some(f => f.includes('r'));
    const num = flags.some(f => f.includes('n'));
    const uniq = flags.some(f => f.includes('u'));

    if (!files.length) { err(term, 'sort: no input file'); term.writeln(''); return; }

    term.writeln('');
    for (const arg of files) {
        const target = resolvePath(arg);
        if (nodeType(target) !== 'file') { fileErr(term, 'sort', arg, nodeType(target)); continue; }
        let lines = getNode(target).split('\n');
        if (uniq) lines = [...new Set(lines)];
        lines.sort(num ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => a.localeCompare(b));
        if (rev) lines.reverse();
        for (const l of lines) term.writeln('  ' + l);
    }
    term.writeln('');
}

// ── uniq ───────────────────────────────────────────────────
export function uniq(term, args) {
    const files = args.filter(a => !a.startsWith('-'));
    if (!files.length) { err(term, 'uniq: no input'); term.writeln(''); return; }

    term.writeln('');
    for (const arg of files) {
        const target = resolvePath(arg);
        if (nodeType(target) !== 'file') { fileErr(term, 'uniq', arg, nodeType(target)); continue; }
        const lines = getNode(target).split('\n');
        let prev = null;
        for (const l of lines) {
            if (l !== prev) { term.writeln('  ' + l); prev = l; }
        }
    }
    term.writeln('');
}

// ── tr ─────────────────────────────────────────────────────
export function tr(term, args) {
    term.writeln('');
    term.writeln(`  ${DIM}tr: works on stdin. pipe support not implemented.${R}`);
    term.writeln(`  ${DIM}(this is a fake terminal, not a real shell)${R}`);
    term.writeln('');
}

// ── cut ────────────────────────────────────────────────────
export function cut(term, args) {
    const dIdx = args.indexOf('-d');
    const fIdx = args.indexOf('-f');
    const delim = dIdx !== -1 ? args[dIdx + 1] : '\t';
    const field = fIdx !== -1 ? parseInt(args[fIdx + 1]) - 1 : 0;
    const files = args.filter((a, i) => !a.startsWith('-') && i !== dIdx + 1 && i !== fIdx + 1);

    if (!files.length) { err(term, 'cut: no input file'); term.writeln(''); return; }

    term.writeln('');
    for (const arg of files) {
        const target = resolvePath(arg);
        if (nodeType(target) !== 'file') { fileErr(term, 'cut', arg, nodeType(target)); continue; }
        for (const line of getNode(target).split('\n')) {
            const parts = line.split(delim);
            term.writeln('  ' + (parts[field] ?? ''));
        }
    }
    term.writeln('');
}

// ── tee ────────────────────────────────────────────────────
export function tee(term) {
    term.writeln('');
    term.writeln(`  ${DIM}tee: stdin required. (pipe not supported — this is a website)${R}`);
    term.writeln('');
}

// ── basename / dirname ────────────────────────────────────
export function basename(term, args) {
    if (!args[0]) { err(term, 'basename: missing operand'); term.writeln(''); return; }
    const suffix = args[1];
    let name = args[0].split('/').pop();
    if (suffix && name.endsWith(suffix)) name = name.slice(0, -suffix.length);
    term.writeln(''); term.writeln('  ' + name); term.writeln('');
}

export function dirname(term, args) {
    if (!args[0]) { err(term, 'dirname: missing operand'); term.writeln(''); return; }
    const parts = args[0].split('/');
    parts.pop();
    term.writeln(''); term.writeln('  ' + (parts.join('/') || '/')); term.writeln('');
}

// ── realpath ───────────────────────────────────────────────
export function realpath(term, args) {
    if (!args[0]) { err(term, 'realpath: missing operand'); term.writeln(''); return; }
    term.writeln('');
    term.writeln('  ' + resolvePath(args[0]));
    term.writeln('');
}

// ── diff (fake) ────────────────────────────────────────────
export function diff(term, args) {
    const files = args.filter(a => !a.startsWith('-'));
    if (files.length < 2) { err(term, 'diff: missing operand after file'); term.writeln(''); return; }
    const [a, b] = files.map(f => resolvePath(f));
    const ta = nodeType(a), tb = nodeType(b);
    term.writeln('');
    if (ta !== 'file') { fileErr(term, 'diff', files[0], ta); term.writeln(''); return; }
    if (tb !== 'file') { fileErr(term, 'diff', files[1], tb); term.writeln(''); return; }
    const linesA = getNode(a).split('\n');
    const linesB = getNode(b).split('\n');
    let hasDiff = false;
    linesA.forEach((line, i) => {
        if (line !== (linesB[i] ?? '')) {
            hasDiff = true;
            term.writeln(`  ${RE}< ${line}${R}`);
            term.writeln(`  ${G}> ${linesB[i] ?? ''}${R}`);
        }
    });
    if (!hasDiff) term.writeln(`  ${DIM}files are identical${R}`);
    term.writeln('');
}

// ── stat ───────────────────────────────────────────────────
export function stat(term, args) {
    if (!args[0]) { err(term, 'stat: missing operand'); term.writeln(''); return; }
    const target = resolvePath(args[0]);
    const type = nodeType(target);
    if (type === null) { err(term, `stat: cannot stat '${args[0]}': No such file or directory`); term.writeln(''); return; }
    const name = target.split('/').pop();
    const size = type === 'file' ? getNode(target).length : 4096;
    const now = new Date().toLocaleString();
    term.writeln('');
    term.writeln(`  File: ${G}${name}${R}`);
    term.writeln(`  Size: ${size}       Blocks: 8    IO Block: 4096  ${type === 'dir' ? 'directory' : 'regular file'}`);
    term.writeln(`  ${DIM}Device: fd01h/64769d   Inode: ${Math.floor(Math.random() * 999999) + 100000}   Links: 1${R}`);
    term.writeln(`  ${DIM}Access: (0644/-rw-r--r--)  Uid: (1000/roxx)  Gid: (1000/roxx)${R}`);
    term.writeln(`  Access: ${now}`);
    term.writeln(`  Modify: ${now}`);
    term.writeln(`  Change: ${now}`);
    term.writeln('');
}

// ── which ──────────────────────────────────────────────────
const WHICH_MAP = {
    zsh: '/usr/bin/zsh', bash: '/usr/bin/bash',
    nvim: '/usr/bin/nvim', vim: '/usr/bin/vim',
    git: '/usr/bin/git', node: '/usr/bin/node',
    python: '/usr/bin/python', python3: '/usr/bin/python3',
    ls: '/usr/bin/ls', cat: '/usr/bin/cat',
    grep: '/usr/bin/grep', find: '/usr/bin/find',
    htop: '/usr/bin/htop', btop: '/usr/bin/btop',
    kitty: '/usr/bin/kitty', hyprland: '/usr/bin/hyprland',
    yay: '/usr/bin/yay', pacman: '/usr/bin/pacman',
};

export function which(term, args) {
    if (!args.length) { err(term, 'which: missing argument'); term.writeln(''); return; }
    term.writeln('');
    for (const cmd of args) {
        if (cmd in WHICH_MAP) term.writeln(`  ${G}${WHICH_MAP[cmd]}${R}`);
        else err(term, `which: no ${cmd} in (/usr/local/bin:/usr/bin:/bin)`);
    }
    term.writeln('');
}

// ── type ───────────────────────────────────────────────────
export function type(term, args) {
    const builtins = ['cd', 'echo', 'help', 'exit', 'clear', 'pwd', 'type', 'alias'];
    term.writeln('');
    for (const cmd of args) {
        if (builtins.includes(cmd)) term.writeln(`  ${cmd} is a shell builtin`);
        else if (cmd in WHICH_MAP) term.writeln(`  ${cmd} is ${WHICH_MAP[cmd]}`);
        else err(term, `type: ${cmd}: not found`);
    }
    term.writeln('');
}

// ── alias ──────────────────────────────────────────────────
const ALIASES = {
    ll: 'ls -la', la: 'ls -a', l: 'ls -l',
    please: 'sudo', yeet: 'yay -Rns',
    '..': 'cd ..', '...': 'cd ../..',
};

export function alias(term, args) {
    term.writeln('');
    if (!args.length) {
        for (const [k, v] of Object.entries(ALIASES)) term.writeln(`  alias ${C}${k}${R}='${v}'`);
    } else {
        for (const a of args) {
            if (a in ALIASES) term.writeln(`  alias ${C}${a}${R}='${ALIASES[a]}'`);
            else err(term, `alias: ${a}: not found`);
        }
    }
    term.writeln('');
}

// ── history ────────────────────────────────────────────────
export function historyCmd(term, histArray) {
    term.writeln('');
    const slice = histArray.slice().reverse().slice(0, 50);
    slice.forEach((cmd, i) => {
        term.writeln(`  ${DIM}${String(i + 1).padStart(3)}${R}  ${cmd}`);
    });
    term.writeln('');
}

// ── man ────────────────────────────────────────────────────
const MAN_PAGES = {
    ls: 'ls - list directory contents\nUsage: ls [OPTION]... [FILE]...\n  -a  include hidden files\n  -l  long listing format',
    cat: 'cat - concatenate files and print on the standard output\nUsage: cat [FILE]...',
    grep: 'grep - print lines matching a pattern\nUsage: grep [OPTIONS] PATTERN [FILE]...\n  -i  case insensitive\n  -n  show line numbers\n  -v  invert match',
    find: 'find - search for files in directory hierarchy\nUsage: find [PATH] [OPTIONS]\n  -name  filter by filename\n  -type  f=file d=directory',
    cd: 'cd - change the shell working directory\nUsage: cd [DIR]',
    pwd: 'pwd - print name of current/working directory',
    echo: 'echo - display a line of text\nUsage: echo [STRING]...',
    wc: 'wc - print newline, word, and byte counts\nUsage: wc [OPTION]... [FILE]...\n  -l  lines  -w  words  -c  chars',
};

export function man(term, args) {
    const page = args[0];
    term.writeln('');
    if (!page) { err(term, 'man: what manual page do you want?'); term.writeln(''); return; }
    if (page in MAN_PAGES) {
        term.writeln(`  ${BOLD}${page.toUpperCase()}(1)${R}  User Commands`);
        term.writeln('');
        for (const l of MAN_PAGES[page].split('\n')) term.writeln('  ' + l);
    } else {
        err(term, `man: no manual entry for ${page}`);
        term.writeln(`  ${DIM}(maybe try the AUR? there's a man-page for that)${R}`);
    }
    term.writeln('');
}

// ── internal helpers ───────────────────────────────────────
function parseNFlag(args, def) {
    const nIdx = args.findIndex(a => a.startsWith('-') && /\d/.test(a));
    let n = def;
    const cleaned = [...args];
    if (nIdx !== -1) {
        n = parseInt(args[nIdx].replace(/\D/g, ''));
        cleaned.splice(nIdx, 1);
    }
    // also handle -n <num>
    const dashN = cleaned.indexOf('-n');
    if (dashN !== -1 && cleaned[dashN + 1]) {
        n = parseInt(cleaned[dashN + 1]);
        cleaned.splice(dashN, 2);
    }
    return { files: cleaned.filter(a => !a.startsWith('-')), n };
}

function fileErr(term, cmd, arg, type) {
    if (type === null) err(term, `${cmd}: ${arg}: No such file or directory`);
    else if (type === 'dir') err(term, `${cmd}: ${arg}: Is a directory`);
    else if (type === 'denied') err(term, `${cmd}: ${arg}: Permission denied`);
}

/** Pad a string that may contain ANSI codes to a visual width */
function padAnsi(str, width) {
    const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = Math.max(0, width - visible.length);
    return str + ' '.repeat(pad);
}
