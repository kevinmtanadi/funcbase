var exec = require('child_process').exec;
var os = require('os');

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