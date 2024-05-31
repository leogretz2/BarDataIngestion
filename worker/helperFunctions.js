// helperFunctions.js
import fs from "fs";

// Utility function to normalize content by removing lines containing only (Line_xxxx): and then removing all whitespace
export function normalizeContent(content) {
    // Remove lines containing only (Line_xxxx):
    const withoutLineNumbers = content.replace(/^\(Line_\d+\):$/gm, "");
    // Remove all whitespace
    return withoutLineNumbers.replace(/\s+/g, "");
}

export function deleteProcessedContent(filePath, linesToDelete) {
    try {
        let fileContent = fs.readFileSync(filePath, "utf8");
        let fileLines = fileContent.split("\n");

        // Convert linesToDelete to a set for efficient lookup
        const linesToDeleteSet = new Set(
            linesToDelete.map(
                (line) => `(Line_${String(line).padStart(4, "0")}):`,
            ),
        );

        console.log("in dpc", linesToDeleteSet);

        // // Convert ranges to list of lines to delete in line# format
        // const linesToDelete = rangesToDelete.map((range) => {
        //     const [begin, end] = range.split("-").map(Number);
        //     const linesToDelete = Array.from(
        //         { length: end - begin + 1 },
        //         (_, i) => begin + i,
        //     );
        //     const stringLinesSet = linesToDelete.map(
        //         (line) => `(Line_${String(line).padStart(4, "0")}):`,
        //     );
        //     return stringLinesSet;
        // });

        // const linesToDeleteSet = new Set(linesToDelete.flat());

        // // Construct linesToDelete from range
        // const [begin, end] = rangesToDelete.map(range=> range.split('-').map(Number))
        // // Find every integer between begin and end
        // const linesToDelete = Array.from({ length: end - begin + 1 }, (_, i)=>(begin + i))

        // // Convert linesToDelete to a set for efficient lookup
        // const linesToDeleteSet = new Set(
        //     linesToDelete.map(
        //         (line) => `(Line_${String(line).padStart(4, "0")}):`,
        //     ),
        // );

        // Filter out lines that need to be deleted
        fileLines = fileLines.filter((line) => {
            const lineNumber = line.match(/^\(Line_(\d+)\):/);
            return !lineNumber || !linesToDeleteSet.has(lineNumber[0]);
        });

        // Join the lines back into a single string
        const processedFileContent = fileLines.join("\n");

        // Normalize and check for significant changes
        if (
            normalizeContent(fileContent) ===
            normalizeContent(processedFileContent)
        ) {
            console.log(`dlp -- same`);
            return false;
        }
        fs.writeFileSync(filePath, processedFileContent, "utf8");
        console.log(
            `Processed content removed from file: ${filePath}`,
            linesToDeleteSet,
        );
        return true;
    } catch (error) {
        console.error(
            `Error removing processed content from file: ${error.message}`,
        );
        throw error;
    }
}

export function cleanUpNewlines(args) {
    for (const key in args) {
        if (typeof args[key] === "string") {
            args[key] = args[key].replace(/\n/g, " "); // Replace newline characters with spaces
        }
    }
}

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function exponentialBackoff(
    apiCall,
    gptModel,
    Messages,
    tools,
    maxRetries = 5,
    baseDelay = 1000,
) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await apiCall(gptModel, Messages, tools);
            return response;
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                throw error;
            }
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
}
