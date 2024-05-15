// workerScript.js
import { parentPort } from "worker_threads";
import { processFile } from "./openaiFunctions.js";

parentPort.on('message', async (filePath) => {
    try {
        const result = await processFile(filePath, parentPort);
    } catch (error) {
        parentPort.postMessage({ status: "error", message: error.message });
    }
});
