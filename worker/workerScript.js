import { parentPort } from "worker_threads";
import { processFile } from "./openaiFunctions.js";

console.log("worker v6");

async function handleProcessing(filePath) {
    try {
        const result = await processFile(filePath, parentPort);
        if (result.status === "success") {
            console.log("Reprocess:", result.reprocess);
            if (result.reprocess) {
                await handleProcessing(filePath); // Reprocess the file
            } else {
                parentPort.postMessage({ status: "success", filePath });
            }
        } else {
            parentPort.postMessage({
                status: "error",
                message: result.message,
            });
        }
    } catch (error) {
        parentPort.postMessage({ status: "error", message: error.message });
    }
}

parentPort.on("message", async (filePath) => {
    await handleProcessing(filePath);
});
