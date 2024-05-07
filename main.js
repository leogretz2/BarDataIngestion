// Importing necessary modules
import fs from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { DynamicThreadPool } from 'poolifier';

// Get the directory name for the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve the path to the worker script
const workerScriptPath = resolve(__dirname, 'workerScript.js');

// Create the dynamic thread pool pointing to the worker script
const pool = new DynamicThreadPool(1, 8, workerScriptPath);

function readFilesRecursively(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = join(dir, file);  // Correct usage of `join`
        if (fs.statSync(filepath).isDirectory()) {
            filelist = readFilesRecursively(filepath, filelist);
        } else if (filepath.endsWith('.txt')) {
            filelist.push(filepath);
            console.log('Added file:', filepath); // Log to check what is being added
        }
    });
    return filelist;
}

const mainFolder = './pre-processed_folder_test';
const filesToProcess = readFilesRecursively(mainFolder);
console.log('Files to process:', filesToProcess); // Log to see all files to be processed

filesToProcess.forEach(file => {
    const task = { filePath: file };
    console.log('Dispatching task:', task);  // Verify the structure before sending
    pool.execute(task)
        .then(response => console.log('Processing complete for:', file, response))
        .catch(error => console.error('Processing failed for:', file, error));
});

// Attach event listeners using the emitter
pool.emitter.on('idle', () => console.log('Pool is idle, all tasks have been processed.'));
pool.emitter.on('drained', () => console.log('Pool is drained, no more tasks in the queue.'));

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down the pool...');
    await pool.destroy();
    console.log('Pool has been destroyed.');
});
