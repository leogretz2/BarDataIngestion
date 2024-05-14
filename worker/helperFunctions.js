// helperFunctions.js
import fs from "fs";

export function deleteProcessedContent(filePath, linesToDelete) {
    try {
        let fileContent = fs.readFileSync(filePath, "utf8");
        let fileLines = fileContent.split('\n');

        // Convert linesToDelete to a set for efficient lookup
        const linesToDeleteSet = new Set(linesToDelete.map(line => `(Line_${String(line).padStart(4, '0')}):`));

        // Filter out lines that need to be deleted
        fileLines = fileLines.filter(line => {
            const lineNumber = line.match(/^\(Line_(\d+)\):/);
            return !lineNumber || !linesToDeleteSet.has(lineNumber[0]);
        });

        // Join the lines back into a single string
        fileContent = fileLines.join('\n');
        fs.writeFileSync(filePath, fileContent, "utf8");
        console.log(`Processed content removed from file: ${filePath}`);
    } catch (error) {
        console.error(`Error removing processed content from file: ${error.message}`);
        throw error;
    }
}

export function cleanUpNewlines(args) {
    for (const key in args) {
        if (typeof args[key] === 'string') {
            args[key] = args[key].replace(/\n/g, ' '); // Replace newline characters with spaces
        }
    }
}
