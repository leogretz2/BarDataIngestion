//Goal: Turn unstructed documents into questions and answers in our database. Note: Some documents have the questions and answers together, and amongst these, some have a majority of other text besides questions. Lastly, others are in seperate documents, and each of these pairs (one question, one answer document) will reside in its own folder. These will then be inside of one master folder that is where the program will pull from to process any data in it and delete after it is processed. Note: this is being done in replit - can we use local folder paths or is there a better way?

// Imports
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import PDFParse from "pdf-parse2";
import { cwd } from "process";

let pdfjsDist;
(async function () {
  pdfjsDist = await import("pdfjs-dist");
  const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.mjs");
  pdfjsDist.GlobalWorkerOptions.workerSrc = pdfjsWorker;
})();

// Function to read document content from a file
function readDocumentContent(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    return null;
  }
}

// Worker function to parse document
function parseDocumentWorker(fileData) {
  // Extract document title and content from fileData
  const documentTitle = fileData.title;
  let documentContent = fileData.content;

  // Recursive function to extract questions from document
  function extractQuestions(content) {
    // Call AI API to isolate question and determine correct function
    const { remainingContent, functionName, functionParameters } =
      callAiApi(content);

    // Call correct function as determined by AI (either updateDatabase or documentCompleted)
    functionName(functionParameters);

    // If there's remaining content, recursively extract more questions
    if (remainingContent) {
      extractQuestions(remainingContent);
    }
  }

  // Start extracting questions from the document content
  extractQuestions(documentContent);
}

// Function to spawn worker for each document
function processDocument(filePath) {
  const fileData = {
    title: extractTitle(filePath),
    content: readDocumentContent(filePath),
  };

  const worker = new Worker(parseDocumentWorker, { workerData: fileData });

  worker.on("error", (error) => {
    console.error(`Worker error: ${error}`);
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
}

// This works
// mammoth
//   .extractRawText({ path: "./practice_mbe/Con_Law/Con_law_questions.docx" })
//   .then((result) => {
//     const text = result.value;
//     console.log(text);
//   })
//   .catch((err) => {
//     console.error("Error extracting text:", err);
//   });

// PART 1 - IMPLMENTATION

// dynamic import since require is not supported (needs a module for some reason)
// const pdfjsLib = await import(
//   "/home/runner/BarDataIngestion/node_modules/pdfjs-dist/build/pdf.mjs"
// );

// import("pdfjs-dist").then((pdfjsLib) => {
//   async function extractTextFromPDF(pdfBuffer) {
//     const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
//     const numPages = pdf.numPages;

//     for (let i = 1; i <= numPages; i++) {
//       const page = await pdf.getPage(i);
//       // Render the page (you can use canvas or other rendering options)
//       // Extract text from the rendered page (see next step)
//     }
//   }
// });

// const tesseractWorker = createWorker();

// // Function to extract text from a PDF with non-selectable text using pdf.js
// async function extractTextFromPDF(pdfBuffer) {
//   const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
//   const numPages = pdf.numPages;

//   for (let i = 1; i <= numPages; i++) {
//     const page = await pdf.getPage(i);
//     // Render the page (you can use canvas or other rendering options)
//     // Extract text from the rendered page (see next step)
//   }

//   console.log("scanned");
// }

// Function to convert a document (PDF, DOCX, etc.) to text7
async function convertToText(filePath) {
  console.log("con", filePath);
  const pdfParser = new PDFParse();
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
      console.log("pdf");
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParser.loadPDF(dataBuffer);
      console.log("dt: ", data.text);
      // const data = await pdfParser(dataBuffer);

      // Check if extracted text is minimal
      if (data.text.trim().length > 50) {
        return data.text; // Return text if sufficiently extracted by pdf-parse
      } else {
        console.log(`needOCR:${filePath}`);

        return "";
        // Use OCR as fallback for scanned PDFs

        extractTextFromPDF(dataBuffer);

        // const tesseractWorker2 = await createWorker("eng");
        // const pdfImagePath =
        //   "./practice_mbe/Barbri_Released_Questions_MBE_2007.pdf"; // Replace with the actual path to your PDF image

        // const result = await tesseractWorker2.recognize(pdfImagePath);
        // console.log("res", result.data.text);

        // await tesseractWorker2.terminate();
        // await tesseractWorker.load();
        // await tesseractWorker.loadLanguage("eng");
        // await tesseractWorker.initialize("eng");
        // const { text } = await tesseractWorker.recognize(dataBuffer);
        // await tesseractWorker.terminate();
        return text; // Return OCR-processed text
      }
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value; // Extract text from DOCX
    }
    return null; // Return null for unsupported file types
  } catch (error) {
    console.error("Error converting document to text:", error);
    return null;
  }
}

// Function to process a single subfolder
async function processSubfolder(subfolderPath) {
  try {
    const files = fs.readdirSync(subfolderPath);
    let combinedText = "";
    for (const file of files) {
      const filePath = path.join(subfolderPath, file);
      const text = await convertToText(filePath);
      if (text) {
        combinedText += text + "\n\n"; // Append text and add newline
        fs.unlinkSync(filePath); // Delete processed file
      }
    }
    // Save combined text to a new .txt file
    const subfolderName = path.basename(subfolderPath);
    const newFilePath = path.join(
      path.dirname(subfolderPath),
      `${subfolderName}.txt`,
    );
    fs.writeFileSync(newFilePath, combinedText);
    // Remove processed subfolder
    fs.rmSync(subfolderPath, { recursive: true });
  } catch (error) {
    console.error("Error processing subfolder:", error);
  }
}

// Function to preprocess data in the working folder
async function preprocessData(workingFolderPath) {
  try {
    const folders = fs.readdirSync(workingFolderPath);
    for (const folder of folders) {
      const folderPath = path.join(workingFolderPath, folder);
      const stats = fs.statSync(folderPath);
      if (stats.isDirectory()) {
        await processSubfolder(folderPath);
      } else {
        // Process individual files in the root of workingFolderPath if needed
        console.log("fP", folderPath, cwd());
        const text = await convertToText("./" + folderPath);
        if (text) {
          const newFilePath = folderPath.replace(
            path.extname(folderPath),
            ".txt",
          );
          fs.writeFileSync(newFilePath, text);
          fs.unlinkSync(folderPath); // Delete the original file
        }
      }
    }
  } catch (error) {
    console.error("Error preprocessing data:", error);
  }
}

// This works to copy practice_mbe to working_folder
async function mainer() {
  console.log("start");
  // Synchronous version to copy practice_mbe to working_folder
  try {
    fs.cpSync("./practice_mbe", "./working_folder", { recursive: true });
    console.log("Folder copied successfully!");

    let filePath =
      "./working_folder/NCBE_Online_MBE_Practice_Exam_1/NCBE_Online_MBE_Practice_Exam_1_Answers.pdf";

    const pdfParser = new PDFParse();
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
      console.log("pdf");
      const dataBuffer = fs.readFileSync(filePath);
      console.log("dB", dataBuffer);
      const data = await pdfParser.loadPDF(dataBuffer);
      // console.log("dt: ", data.text);
    }

    // await preprocessData("./working_folder");
  } catch (error) {
    console.error("Error copying folder:", error);
  }
  console.log("done");
}

// mainer();
