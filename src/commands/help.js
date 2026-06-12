const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

export function help(term) {
    term.writeln('');
    term.writeln(`  ${C.cyan}${C.bold}Available commands${C.reset}  ${C.dim}(you actually read the docs, respect)${C.reset}`);
    term.writeln('');

    const sections = [
        {
            title: 'Personal',
            cmds: [
                ['links', 'show all my links'],
                ['about', 'who even am i'],
                ['projects', 'things i built instead of sleeping'],
                ['contact', 'ways to reach me (or not)'],
                ['neofetch', 'print system info again'],
                ['theme', 'list / apply a colorscheme  e.g. theme dracula'],
            ],
        },
        {
            title: 'Filesystem',
            cmds: [
                ['ls [-la]', 'list directory contents'],
                ['cd <dir>', 'change directory'],
                ['pwd', 'print working directory'],
                ['cat <file>', 'print file contents'],
                ['head/tail', 'first/last N lines of a file'],
                ['find', 'search for files  e.g. find . -name "*.md"'],
                ['stat <file>', 'file metadata'],
                ['mkdir/touch', 'create dirs/files  (ephemeral)'],
                ['rm/cp/mv', 'remove/copy/move  (fake but feels real)'],
                ['diff <a> <b>', 'compare two files'],
                ['realpath', 'resolve absolute path'],
                ['basename/dirname', 'path component helpers'],
            ],
        },
        {
            title: 'Text processing',
            cmds: [
                ['echo', 'print text  echo -n no newline'],
                ['wc [-lwc]', 'count lines, words, chars'],
                ['grep [-inv]', 'search file content'],
                ['sort [-rnu]', 'sort lines'],
                ['uniq', 'remove duplicate lines'],
                ['cut -d -f', 'extract fields'],
                ['seq', 'generate number sequences'],
            ],
        },
        {
            title: 'System info',
            cmds: [
                ['uname [-a]', 'kernel / system info'],
                ['whoami', 'current user'],
                ['id', 'uid/gid/groups'],
                ['hostname', 'machine name'],
                ['uptime', 'how long since last oopsie'],
                ['date', 'current date/time'],
                ['cal', 'calendar'],
                ['ps', 'running processes'],
                ['free', 'memory usage'],
                ['df', 'disk usage'],
                ['du', 'directory size'],
                ['env/printenv', 'environment variables'],
                ['which', 'locate a command'],
                ['man <cmd>', 'manual page for a command'],
                ['history', 'command history'],
                ['alias', 'show defined aliases'],
            ],
        },
        {
            title: 'Shell',
            cmds: [
                ['clear', 'clear the screen  (also Ctrl+L)'],
                ['exit', 'close tab (coward)'],
                ['true/false', 'exit 0 / exit 1'],
                ['sleep <n>', 'wait N seconds (nothing actually waits)'],
                ['yes', 'print y forever (capped)'],
            ],
        },
    ];

    for (const { title, cmds } of sections) {
        term.writeln(`  ${C.yellow}── ${title} ${'─'.repeat(38 - title.length)}${C.reset}`);
        for (const [cmd, desc] of cmds) {
            term.writeln(`  ${C.green}${cmd.padEnd(22)}${C.reset}${C.dim}${desc}${C.reset}`);
        }
        term.writeln('');
    }

    term.writeln(`  ${C.dim}tip: tab completion works on commands and theme names.${C.reset}`);
    term.writeln(`  ${C.dim}tip: arrow keys navigate history. Ctrl+C / Ctrl+L work too.${C.reset}`);
    term.writeln('');
}
