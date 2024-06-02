var sys = require('sys');
var exec = require('child_process').exec;
var os = require('os');

function puts(error, stdout, stderr) { sys.puts(stdout) }

if (os.type() === 'Linux')
    exec("cd src/backend && go build && ./backend", puts);
else if (os.type() === 'Windows_NT')
    exec("cd src/backend && go build && backend.exe", puts);
else
   throw new Error("Unsupported OS found: " + os.type());