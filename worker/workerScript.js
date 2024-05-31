import { parentPort } from "worker_threads";
import { processFile } from "./openaiFunctions.js";

console.log("worker v7");

async function handleProcessing(filePath) {
    console.log("handling processing for: ", filePath);
    try {
        let reprocess = true;
        // This is dangerous, consider changing
        while (reprocess) {
            const result = await processFile(filePath, parentPort);
            if (result.status === "success") {
                reprocess = result.reprocess;
                if (!reprocess) {
                    parentPort.postMessage({ status: "success", filePath });
                }
            } else {
                parentPort.postMessage({
                    status: "error",
                    message: result.message,
                });
                reprocess = false; // Stop processing on error
            }
        }
    } catch (error) {
        parentPort.postMessage({ status: "error", message: error.message });
    }
}

parentPort.on("message", async (filePath) => {
    await handleProcessing(filePath);
});
