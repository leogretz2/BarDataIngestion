import { spawn } from "child_process";

// TODO: preprocessing to create working_folder from practice_mbe

// Python script handles entire folder to minimize Python interpreter creation
const pythonProcess = spawn("python", ["extract_txt.py"]);

console.log("py spawned");

pythonProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
});

pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
})
pythonProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
});
