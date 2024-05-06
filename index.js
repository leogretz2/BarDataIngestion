//Goal: Turn unstructed documents into questions and answers in our database. Note: Some documents have the questions and answers together, and amongst these, some have a majority of other text besides questions. Lastly, others are in seperate documents, and each of these pairs (one question, one answer document) will reside in its own folder. These will then be inside of one master folder that is where the program will pull from to process any data in it and delete after it is processed. Note: this is being done in replit - can we use local folder paths or is there a better way?

// Imports
const fs = require("fs");
// const fs = require("fs-extra");
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
// const pdfjsLib = require("pdfjs-dist");
const { createWorker } = require("tesseract.js");

// Part 1 - Data Preprocessing
/*
  0. User organizes files so that if q&a are in one doc, leave it and if in multple they are put into a subfolder of two files.
  1. Access practice_mbe folder, make a new working_folder as a copy.
  2. For each sub-folder in working_folder
    a. For each file in the folder
        i. check file type (pdf, txt, doc...)
          1. if textbased convert to .txt while keeping /n/ spaces
          2. if pdf or image conduct ocr and make .txt
        ii. combine all .txt files from sub-folder into a single .txt (using subfolder name as .txt document name)
        iii. Save in main folder and delete processed sub folder and files
  3. For each solo document in working_folder
    a. check file type (pdf, txt, doc...)
      i. if textbased convert to .txt while keeping /n/ spaces
      ii. if pdf or image conduct ocr and make .txt file
      iii. Delete old file and save new one with old files name.txt in working_folder
  4. The folder should now contain only the .txt files (one for each previous folder) - alternatively can use a new folder or dictionary
  5. After recursively processing working_folder, leave it completed and empty
*/

// Part 2 - AI Parsing
/*
  1. Recursively loop through files in main folder
  2. For each file:
    a. Begin a new thread (worker)
    b. Construct prompt for each .txt file by replacing {current_document_title} and {current_document} with document title and document content. The ai will need to be set to function calling only and the current prompt adapted for function calling. The purpose is parsing the file into list of objects containing:
  - document_title (title | NA)
  - document_date (year | NA)
  - publisher (name | NA)
  - question (string) (primary key)
  - options (string[])
  - answer ('A'|'B'|'C'|'D') (correct answer)
  - answer_origin ('document' | 'generated')
  - explanation (string) (explanation for correct answer)
  - explanation_source ('document' | 'generated')
  - difficulty_level (integer 1-100)
  - law_category (string) (one of the seven)
  - topic (string[])

  Basic API call structure (will need to adapt to create tool call parameters and only give it the option to call the function/tool to add to the database or the function to end):
  ```
  import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: [
    {
      "role": "system",
      "content": "You are an AI designed to assist in the organization and management of bar exam study materials. Your current task is to format, validate, and load various types of legal questions into a structured database. You are a coveted legal expert who is a bar exam master and gets a perfect score on every question\n\nOperational Guidelines:\n1. Address one question at a time for accuracy.\n2. Employ the following structured formats for data entry:\n\nFor Multistate Bar Examination (MBE) questions:\n{\n  \"Document title\": \" Title or NA (string)\",\n  \"Document Date\": \" Year or NA (integer)\",\n  \"Publisher\": \" Name or NA (string)\",\n  \"question_type\": \"MBE\",\n  \"question\": \"Input question text here (string)\",\n  \"answers\": {\n    \"A\": \"First option (string)\",\n    \"B\": \"Second option (string)\",\n    \"C\": \"Third option (string)\",\n    \"D\": \"Fourth option (string)\"\n  },\n  \"correct_answer\": \"Correct option letter (string)\",\n  \"answer_origin\": \"Document or Generated (string)\",\n  \"explanation\": \"Explanation for the correct answer (string)\",\n  \"explanation_origin\": \"Document or Generated (string)\",\n  \"difficulty_level\": \"Difficulty from 1 to 100 (integer)\",\n  \"law_category_tags\": [\"Specific law category (string)\", \"Additional tags as applicable (string)\"],\n  \"topic\": [\"Specific topic(s) under the law category (string)\", \"(string)\", \"(string)\"],\n}\n\nFor Multistate Essay Examination (MEE) questions:\n{\n  \"Document title\": \" Title or NA (string)\",\n  \"Document Date\": \" Year or NA (integer)\",\n  \"Publisher\": \" Name or NA (string)\",\n  \"question_type\": \"MEE\",\n  \"question\": \"Input question text here (string)\",\n  \"possible_answers\": [\"First option (string)\", \"Second option (string)\", \"...\"],\n  \"answer\": \"Correct answer (string)\",\n  \"answer_origin\": \"Document or Generated (string)\",\n  \"explanation\": \"Explanation for the correct answer (string)\",\n  \"explanation_origin\": \"Document or Generated (string)\",\n  \"difficulty_level\": \"Difficulty from 1 to 100 (integer)\",\n  \"law_category_tags\": [\"Specific law category (string)\", \"Additional tags as applicable (string)\"],\n  \"topic\": [\"Specific topic(s) under the law category (string)\", \"(string)\", \"(string)\"],\n}\n\nFor Multistate Performance Test (MPT) questions:\n{\n  \"Document title\": \" Title or NA (string)\",\n  \"Document Date\": \" Year or NA (integer)\",\n  \"Publisher\": \" Name or NA (string)\",\n  \"question_type\": \"MPT\",\n  \"question\": \"Input question text here (string)\",\n  \"possible_answers\": [\"First option (string)\", \"Second option (string)\", \"...\"],\n  \"answer\": \"Correct answer (string)\",\n  \"answer_origin\": \"Document or Generated (string)\",\n  \"explanation\": \"Explanation for the correct answer (string)\",\n  \"explanation_origin\": \"Document or Generated (string)\",\n  \"difficulty_level\": \"Difficulty from 1 to 100 (integer)\",\n  \"law_category_tags\": [\"Specific law category (string)\", \"Additional tags as applicable (string)\"],\n  \"topic\": [\"Specific topic(s) under the law category (string)\", \"(string)\", \"(string)\"],\n}\n\nContext on law area categories (e.g., \"Contract Law\", \"Criminal Law\", etc.) and Define topics under each law area (e.g., \"Breach of Contract\" under Contract Law, \"Mens Rea\" under Criminal Law):\n\nReference for categories and topics:\n```\n(removed for brevity)\n```\n\n3. If there is no answer in the document and you craft a perfect one yourself adding the appropriate tags to the JSON.\n\nUpon entering data, questions from the current document will be programmatically removed to prevent duplication.\n\nTake a deep breath and think step by step to get the best answer.\n\nCurrent Document:\n```\n{current_document_title}\n{current_document}\n```"
    }
  ],
  temperature: 0,
  max_tokens: 4095,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
});
````

*/

const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

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

// Main function to process documents
function main() {
  const basePath = "/path/to/main/folder";

  fs.readdirSync(basePath).forEach((file) => {
    const filePath = `${basePath}/${file}`;
    processDocument(filePath);
  });
}

// Check if main thread
if (isMainThread) {
  // uncomment when ready
  // main();
} else {
  // If worker thread, listen for messages from parent thread
  parentPort.on("message", (message) => {
    // No action required in worker thread
  });
}

// Mock functions for AI API, parsing AI response, updating database, and extracting title
function callAiApi(documentContent) {
  // Call OpenAI API with prompt and two possible function calls (updateDatabase and docCompleted)
  // Returns JSON containing function to call and required parameters for that function
  return { functionName, functionParameters }; // Mock response
}

function extractTitle(filePath) {
  // Split path on '/' character in filePath then return last in array
  // Extract title from file path or content
  return "Document Title"; // Mock title
}

// Part 3 - Database deposit
/*
1. Execute function call made by ai:
  a. Add to database funnction
    1. Accepts JSON object outputted by ai tools call
    2. Finds and deletes question and answer in the document that it just received (to stop duplicates)
    3. Adds data to database 
      i. checks if that question is already in the database
        3.1. if it is, get the question and it's data to reconcile the two
          i. if both object are exactly the same throw out the new one
          ii. if answers are differnt, use the one that's answer source is not ai
          iii. if both are ai delete the existing question object and do not add new one
          iv. if explinations are different use the one that's soruce was not ai. if both are ai then use longer one.
          v. if difficulty is different average the two numbers
          vi. if law_category is different use both tags
          vii. if topic is different use both tags
          viii. If any other fields are empty then populate them, if they arelready have a value then just throw out the new value.
        3.2. If it is not in the database, add it to the database.

  function updateDatabase(extractedQuestions) {
    // Update database with extracted questions
  }

  b. Move Next Doc Function (make it clear in the prompt for ai to use this if there are not obvious questions left)
    1. Delete current document from folder or move to another folder for post processing manual inspection
    2. Move on to next .txt document, populate the prompt with the new document title and content.
    3. If there are no more documents left in folder then print sucess message


Repopulate the current document varaible in the prompt after each function call to add to database or move to next document if next doc function call is made. if no more docs then stop.
  Functions to be called:

*/

// This function is responsible for updating the database with the extracted questions obtained from parsing the document content. It ensures that extracted questions are added to the database in a structured format, and handles cases where questions might already exist in the database to prevent duplication. The function also performs data reconciliation if a question with the same primary key (question string) already exists in the database.
function updateDatabase(question) {
  // Update database with extracted questions
  // question is a Question object outputted by ai tools call
  // Finds and deletes question and answer in the document that it just received (to stop duplicates)
  /*
    Adds data to database 
      i. checks if that question is already in the database
        3.1. if it is, get the question and it's data to reconcile the two
          i. if both object are exactly the same throw out the new one
          ii. if answers are differnt, use the one that's answer source is not ai
          iii. if both are ai delete the existing question object and do not add new one
          iv. if explanations are different use the one that's soruce was not ai. if both are ai then use longer one.
          v. if difficulty is different average the two numbers
          vi. if law_category is different use both tags
          vii. if topic is different use both tags
          viii. If any other fields are empty then populate them, if they arelready have a value then just throw out the new value.
        3.2. If it is not in the database, add it to the database.
  */
}

function documentCompleted() {
  // This is called if the AI determines that the document is complete
  // Print success message and stop thread
}

// Experimentation
// console.log("cw", process.cwd());

// fs.readdir(".", (err, files) => {
//   if (err) {
//     console.error("Error reading directory:", err);
//     return;
//   }

//   console.log("Files in the directory:");
//   files.forEach((file) => {
//     console.log(file);
//   });
// });

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
const pdfjsLib = await import('/home/runner/BarDataIngestion/node_modules/pdfjs-dist/build/pdf.mjs');

import('pdfjs-dist').then(pdfjsLib => {
  async function extractTextFromPDF(pdfBuffer) {
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      // Render the page (you can use canvas or other rendering options)
      // Extract text from the rendered page (see next step)
    }
  }

  

}

const tesseractWorker = createWorker();

// Function to extract text from a PDF with non-selectable text using pdf.js
async function extractTextFromPDF(pdfBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    // Render the page (you can use canvas or other rendering options)
    // Extract text from the rendered page (see next step)
  }

  console.log("scanned");
}

// Function to convert a document (PDF, DOCX, etc.) to text
async function convertToText(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      // Check if extracted text is minimal
      if (data.text.trim().length > 50) {
        return data.text; // Return text if sufficiently extracted by pdf-parse
      } else {
        // Use OCR as fallback for scanned PDFs
        console.log(`needOCR:${filePath}`);

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
        combinedText += text + "\n"; // Append text and add newline
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
        const text = await convertToText(folderPath);
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
async function main() {
  // Synchronous version to copy practice_mbe to working_folder
  try {
    fs.cpSync("./practice_mbe", "./working_folder", { recursive: true });
    console.log("Folder copied successfully!");

    await preprocessData("./working_folder");
  } catch (error) {
    console.error("Error copying folder:", error);
  }
  console.log("done");
}

main();
