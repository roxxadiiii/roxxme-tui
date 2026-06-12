// ── Virtual Filesystem ─────────────────────────────────────
// Every node is either a file (string content) or dir (object).
// Paths are resolved relative to cwd. No actual I/O — pure fake.

export const FS = {
    '/': {
        home: {
            roxx: {
                'about.txt': `hey, i'm roxx.

i build things for the web (and sometimes break them).
i daily drive arch linux (btw) with hyprland
and i have opinions about your tech stack.

currently obsessed with:
  → terminal UIs
  → minimal software
  → making computers go fast
  → writing configs nobody asked for`,

                'links.txt': `github    https://github.com/roxxme
twitter   https://twitter.com/roxxme
linkedin  https://linkedin.com/in/roxxme
email     roxx@example.com`,

                'readme.md': `# roxxme-tui
a linktree that boots like linux.
built with xterm.js + vanilla js.
no frameworks were harmed.`,

                '.zshrc': `# roxx's zshrc
# (yes i committed this, no i won't explain the aliases)

export EDITOR=nvim
export TERM=xterm-256color

alias ls='eza --icons'
alias cat='bat'
alias grep='rg'
alias vim='nvim'
alias please='sudo'
alias yeet='yay -Rns'
alias update='yay -Syu --noconfirm && echo "btw"'

# prompt (stolen from the internet, improved by me)
PROMPT='%F{cyan}%n%f@%F{blue}%m%f %F{yellow}%~%f $ '`,

                '.bashrc': `# .bashrc
# i don't actually use bash
# this file exists for compliance reasons`,

                'projects': {
                    'roxxme-tui': {
                        'README.md': `# roxxme-tui
this very site. a terminal-based personal page.
stack: xterm.js, vanilla js, vite.
repo: https://github.com/roxxme/roxxme-tui`,
                        'index.html': `<!DOCTYPE html><!-- you found the source. congrats. -->`,
                    },
                    'project-two': {
                        'README.md': `# project-two
something cool built at 2am.
details: classified.`,
                    },
                    'project-three': {
                        'README.md': `# project-three
don't look at the commit messages.
seriously.`,
                        'main.py': `# TODO: fix this
# FIXME: and this
# HACK: yeah this too
print("it works on my machine")`,
                    },
                },

                'dotfiles': {
                    'hypr': {
                        'hyprland.conf': `# hyprland config
# took 3 days, worth it

monitor=,preferred,auto,1

$terminal = kitty
$menu = wofi --show drun

bind = SUPER, Return, exec, $terminal
bind = SUPER, Q, killactive
bind = SUPER, M, exit`,
                    },
                    'kitty': {
                        'kitty.conf': `# kitty config
font_family      JetBrains Mono
font_size        13.0
background       #1e1e2e
foreground       #cdd6f4
cursor           #f5e0dc
# catppuccin mocha, obviously`,
                    },
                    'nvim': {
                        'init.lua': `-- neovim config
-- don't ask how long this took
require('plugins')
require('keymaps')
require('lsp')
-- vim.opt.relativenumber = true  (i'm not a psychopath)
vim.opt.number = true`,
                    },
                    'README.md': `# dotfiles
my personal dotfiles.
stow-managed. hyprland + kitty + nvim.
feel free to steal, credit appreciated.`,
                },

                '.ssh': null,         // permission denied dir
                '.secrets': null,     // permission denied dir
            },
        },
        etc: {
            'os-release': `NAME="Arch Linux"
PRETTY_NAME="Arch Linux"
ID=arch
BUILD_ID=rolling
HOME_URL="https://archlinux.org/"
SUPPORT_URL="https://bbs.archlinux.org/"
BUG_REPORT_URL="https://bugs.archlinux.org/"`,
            'hostname': `archlinux`,
            'shells': `/bin/sh
/bin/bash
/bin/zsh
/usr/bin/zsh
/usr/bin/fish
# (i use zsh btw)`,
            'passwd': `root:x:0:0:root:/root:/bin/bash
roxx:x:1000:1000:roxx:/home/roxx:/usr/bin/zsh`,
            'fstab': `# /etc/fstab
# <device>  <dir>  <type>  <options>  <dump>  <pass>
UUID=xxxx-xxxx  /      ext4  defaults   0  1
UUID=yyyy-yyyy  /boot  vfat  defaults   0  2`,
        },
        proc: {
            'version': `Linux version 6.9.1-arch1-1 (roxx@archlinux) (gcc 14.1.1) #1 SMP PREEMPT_DYNAMIC`,
            'uptime': `24052.42 19607.38`,
            'cpuinfo': `processor   : 0
vendor_id   : GenuineIntel
model name  : Intel(R) Core(TM) i7 (too fast for your basic distro)
cpu MHz     : 3600.000
cache size  : 12288 KB`,
            'meminfo': `MemTotal:       16384000 kB
MemFree:         8192000 kB
MemAvailable:   10240000 kB
Buffers:          512000 kB
Cached:          2048000 kB
SwapTotal:       8192000 kB
SwapFree:        8192000 kB`,
        },
        usr: {
            bin: {
                'README': `these aren't real binaries.
go touch grass.`,
            },
        },
        tmp: {
            'session.log': `[roxx@archlinux] session started
[roxx@archlinux] loaded hyprland
[roxx@archlinux] opened kitty
[roxx@archlinux] opened this website
[roxx@archlinux] you are here`,
        },
        dev: {
            'null': ``,
            'zero': `0000000000000000`,
            'random': `¡£∞§¶•ªº–≠`,
        },
    },
};

// ── Path resolution ────────────────────────────────────────
// Use an object so consumers always read the live value via getCWD().
const state = { cwd: '/home/roxx' };

export function getCWD() { return state.cwd; }
export function setCWD(path) { state.cwd = path; }

/** @deprecated use getCWD() — kept for any legacy references */
export let CWD = '/home/roxx';

/** Resolve a path string to an absolute path */
export function resolvePath(inputPath) {
    if (!inputPath || inputPath === '~') return getCWD();
    if (inputPath.startsWith('~/')) return '/home/roxx/' + inputPath.slice(2);
    if (inputPath.startsWith('/')) return normalizePath(inputPath);
    return normalizePath(getCWD() + '/' + inputPath);
}

function normalizePath(path) {
    const parts = path.split('/').filter(Boolean);
    const stack = [];
    for (const p of parts) {
        if (p === '..') stack.pop();
        else if (p !== '.') stack.push(p);
    }
    return '/' + stack.join('/');
}

/** Walk the FS tree and return the node at path, or null */
export function getNode(absPath) {
    if (absPath === '/') return FS['/'];
    const parts = absPath.split('/').filter(Boolean);
    let node = FS['/'];
    for (const part of parts) {
        if (node === null || typeof node === 'string') return null;
        if (!(part in node)) return null;
        node = node[part];
    }
    return node;
}

/** Returns 'file' | 'dir' | 'denied' | null */
export function nodeType(absPath) {
    // permission-denied paths
    if (absPath.includes('/.ssh') || absPath.includes('/.secrets')) return 'denied';
    const node = getNode(absPath);
    if (node === null) return null;
    if (typeof node === 'string') return 'file';
    return 'dir';
}

/** Display name for CWD (replaces /home/roxx with ~) */
export function displayCWD() {
    return getCWD().replace('/home/roxx', '~') || '/';
}
