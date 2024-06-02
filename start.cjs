var exec = require('child_process').exec;
var os = require('os');

function puts(error, stdout, stderr) {
    console.log(stdout)
}

if (os.type() === 'Linux')
    exec("cd src/backend && ./backend", puts);
else if (os.type() === 'Windows_NT')
    exec("cd src/backend && backend.exe", puts);
else
   throw new Error("Unsupported OS found: " + os.type());