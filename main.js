// main.js
import { Worker } from "worker_threads";
import fs from "fs";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerScriptPath = resolve(__dirname, "workerScript.js");
const maxWorkers = 20; // Maximum number of concurrent workers
const workers = [];
const tasks = [];
const responses = [];

// Read files recursively and prepare tasks
function readFilesRecursively(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = readFilesRecursively(filepath, filelist);
        } else if (filepath.endsWith(".txt")) {
            filelist.push(filepath);
            console.log("Added file:", filepath);
        }
    });
    return filelist;
}

// Create worker and handle messaging
function createWorker() {
    const worker = new Worker(workerScriptPath);
    worker.on("message", (result) => {
        console.log("Response from worker:", result);
        responses.push(result);
        if (tasks.length > 0) {
            worker.postMessage(tasks.pop());
        } else {
            worker.terminate();
            workers.splice(workers.indexOf(worker), 1); // Remove terminated worker from the list
            if (tasks.length === 0 && workers.length === 0) {
                console.log("All tasks completed.");
            }
        }
    });
    worker.on("error", (err) => console.error("Worker error:", err));
    worker.on("exit", (code) => {
        if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
        workers.splice(workers.indexOf(worker), 1); // Ensure the worker is removed from the list on exit
    });
    workers.push(worker);
    return worker;
}

// Initialize and process tasks
function initAndProcessTasks() {
    const mainFolder = "./pre-processed_folder_test";
    const filesToProcess = readFilesRecursively(mainFolder);
    console.log("Files to process:", filesToProcess);

    filesToProcess.forEach((file) => {
        tasks.push(file);
    });

    // Create initial workers up to maxWorkers or the number of tasks, whichever is smaller
    while (tasks.length > 0 && workers.length < maxWorkers) {
        createWorker().postMessage(tasks.pop());
    }
}

initAndProcessTasks();

process.on("SIGINT", async () => {
    console.log("Shutting down workers...");
    workers.forEach((worker) => worker.terminate());
    console.log("All workers have been terminated.");
});
