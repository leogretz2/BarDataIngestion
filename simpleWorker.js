// worker.js
import { parentPort } from 'worker_threads';
import { readFile } from 'fs/promises';

async function processFile(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    return `File processed with content length: ${data.length}`;
  } catch (error) {
    throw error;
  }
}

parentPort.on('message', async (filePath) => {
  try {
    const result = await processFile(filePath);
    parentPort.postMessage({ message: result });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
