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

console.log("Project built successfully")