import { Worker } from "worker_threads";
import fs from "fs";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import ProgressBar from "progress";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerScriptPath = resolve(__dirname, "worker", "workerScript.js");
const maxWorkers = 20;
const workers = [];
const tasks = [];
const responses = [];
const progressBars = {};

// Read Files Recursively
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
        if (result.status === "success") {
            responses.push(result);
        } else {
            console.error("Worker error:", result.message);
        }

        // Add file back to tasks if it needs reprocessing
        if (result.reprocess) {
            tasks.push(result.filePath);
        }

        // If there are more tasks, send the next task to the worker
        if (tasks.length > 0) {
            const nextTask = tasks.pop();
            if (nextTask !== undefined) {
                worker.postMessage(nextTask);
            } else {
                worker.terminate();
                workers.splice(workers.indexOf(worker), 1); // Remove terminated worker from the list
                if (tasks.length === 0 && workers.length === 0) {
                    console.log("All tasks completed.");
                }
            }
        } else {
            worker.terminate();
            workers.splice(workers.indexOf(worker), 1); // Remove terminated worker from the list
            if (tasks.length === 0 && workers.length === 0) {
                console.log("All tasks completed.");
            }
        }
    });

    worker.on("error", (err) => console.error("Worker on error:", err));

    worker.on("exit", (code) => {
        if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
        workers.splice(workers.indexOf(worker), 1); // Ensure the worker is removed from the list on exit
    });

    workers.push(worker);
    return worker;
}

// Initialize and Process Tasks
function initAndProcessTasks() {
    const mainFolder = "./preprocessed_folder_test_tiny";
    const filesToProcess = readFilesRecursively(mainFolder);
    console.log("Files to process:", filesToProcess);

    filesToProcess.forEach((file) => {
        tasks.push(file);
        const fileContent = fs.readFileSync(file, "utf8");
        const totalLines = fileContent.split("\n").length;
        progressBars[file] = new ProgressBar(
            `Processing ${file} [:bar] :percent :etas`,
            {
                total: totalLines,
                width: 20,
            },
        );
    });

    // Create initial workers up to maxWorkers or the number of tasks, whichever is smaller
    while (tasks.length > 0 && workers.length < maxWorkers) {
        const nextTask = tasks.pop();
        if (nextTask !== undefined) {
            let currentWorker = createWorker();
            currentWorker.postMessage(nextTask);
        }
    }
}

initAndProcessTasks();

// Handle Process Exit
process.on("SIGINT", async () => {
    console.log("Shutting down workers...");
    workers.forEach((worker) => worker.terminate());
    console.log("All workers have been terminated.");
});
