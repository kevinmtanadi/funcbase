var exec = require('child_process').exec;
var os = require('os');

function puts(error, stdout, stderr) {
    console.log(stdout)
}

exec("go mod tidy", puts)
if (os.type() === 'Linux')
    exec("cd src/backend && go build", puts);
else if (os.type() === 'Windows_NT')
    exec("cd src/backend && go build", puts);
else
   throw new Error("Unsupported OS found: " + os.type());

var linuxStart = exec("cd src/backend && ./backend");
var winStart = exec("cd src/backend && backend.exe");

if (os.type() === 'Linux')
    linuxStart.stdout.on('data', function(data) {
        console.log(data)
    })
else if (os.type() === 'Windows_NT')
    winStart.stdout.on('data', function(data) {
        console.log(data)
    })
else
    throw new Error("Unsupported OS found: " + os.type());   