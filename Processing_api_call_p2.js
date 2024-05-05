//it reverted to an old version, maybe when I renamed it?


// Part 2 - AI Parsing

/*
  Pseudocode:
  1. Recursively loop through files in main folder
  2. For each file:
    a. Begin a new thread (worker)
    b. Construct prompt for each .txt file by replacing {current_document_title} and {current_document} with document title and document content.
    c. Send prompt to OpenAI API
    d. Handle response and send to correct function
        i. Dummy function to handle responses from OpenAI API for MBE
        ii. Dummy function to handle responses from OpenAI API for MEE
        iii. Dummy function to handle responses from OpenAI API for MPT
        iv. Function to break if there are no more questions in the document
  3. Wait for all threads to finish
*/

//installs
//npm install poolifier

//imports
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//** v Temporary for Testing v **
// Simulated function to handle API responses and log completion or errors
function logResponse(data) {
  console.log("Response from API: ", JSON.stringify(data));
}
//** ^ Temporary for Testing ^ **

const fs = require("fs");
const path = require("path");
const { ThreadWorker } = require("poolifier");

// Helper function to read all text files recursively from a given directory
function readFilesRecursively(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = readFilesRecursively(filepath, filelist);
    } else if (filepath.endsWith(".txt")) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

//defining the tools for the llm
const tools = [
  {
    type: "function",
    function: {
      name: "insert_mbe_question",
      description: "Insert MBE question into the database",
      parameters: {
        type: "object",
        properties: {
          "Document title": { type: "string" },
          "Document Date": { type: "integer" },
          Publisher: { type: "string" },
          question_type: { type: "string", const: "MBE" },
          question: { type: "string" },
          answers: {
            type: "object",
            properties: {
              A: { type: "string" },
              B: { type: "string" },
              C: { type: "string" },
              D: { type: "string" },
            },
          },
          correct_answer: { type: "string" },
          answer_origin: { type: "string" },
          explanation: { type: "string" },
          explanation_origin: { type: "string" },
          difficulty_level: { type: "integer" },
          law_category_tags: { type: "array", items: { type: "string" } },
          topic: { type: "array", items: { type: "string" } },
        },
        required: ["question_type", "question", "answers", "correct_answer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insert_mee_question",
      description: "Insert MEE question into the database",
      parameters: {
        type: "object",
        properties: {
          "Document title": { type: "string" },
          "Document Date": { type: "integer" },
          Publisher: { type: "string" },
          question_type: { type: "string", const: "MEE" },
          question: { type: "string" },
          possible_answers: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          answer_origin: { type: "string" },
          explanation: { type: "string" },
          explanation_origin: { type: "string" },
          difficulty_level: { type: "integer" },
          law_category_tags: { type: "array", items: { type: "string" } },
          topic: { type: "array", items: { type: "string" } },
        },
        required: ["question_type", "question", "answer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insert_mpt_question",
      description: "Insert MPT question into the database",
      parameters: {
        type: "object",
        properties: {
          "Document title": { type: "string" },
          "Document Date": { type: "integer" },
          Publisher: { type: "string" },
          question_type: { type: "string", const: "MPT" },
          question: { type: "string" },
          possible_answers: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          answer_origin: { type: "string" },
          explanation: { type: "string" },
          explanation_origin: { type: "string" },
          difficulty_level: { type: "integer" },
          law_category_tags: { type: "array", items: { type: "string" } },
          topic: { type: "array", items: { type: "string" } },
        },
        required: ["question_type", "question", "answer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_end_of_questions",
      description: "Check if there are no more questions in the document",
      parameters: {
        type: "object",
        properties: {
          end_of_questions: { type: "boolean" },
        },
        required: ["end_of_questions"],
      },
    },
  },
];

//base system prompt
const content =
  'You are an AI designed to assist in the organization and management of bar exam study materials. Your current task is to format, validate, and load various types of legal questions into a structured database. You are a coveted legal expert who is a bar exam master and gets a perfect score on every question\n\nOperational Guidelines:\n1. Address one question at a time for accuracy.\n2. Employ the following structured formats for data entry:\n\nFor Multistate Bar Examination (MBE) questions:\n{\n  "Document title": " Title or NA (string)",\n  "Document Date": " Year or NA (integer)",\n  "Publisher": " Name or NA (string)",\n  "question_type": "MBE",\n  "question": "Input question text here (string)",\n  "answers": {\n    "A": "First option (string)",\n    "B": "Second option (string)",\n    "C": "Third option (string)",\n    "D": "Fourth option (string)"\n  },\n  "correct_answer": "Correct option letter (string)",\n  "answer_origin": "Document or Generated (string)",\n  "explanation": "Explanation for the correct answer (string)",\n  "explanation_origin": "Document or Generated (string)",\n  "difficulty_level": "Difficulty from 1 to 100 (integer)",\n  "law_category_tags": ["Specific law category (string)", "Additional tags as applicable (string)"],\n  "topic": ["Specific topic(s) under the law category (string)", "(string)", "(string)"],\n}\n\nFor Multistate Essay Examination (MEE) questions:\n{\n  "Document title": " Title or NA (string)",\n  "Document Date": " Year or NA (integer)",\n  "Publisher": " Name or NA (string)",\n  "question_type": "MEE",\n  "question": "Input question text here (string)",\n  "possible_answers": ["First option (string)", "Second option (string)", "..."],\n  "answer": "Correct answer (string)",\n  "answer_origin": "Document or Generated (string)",\n  "explanation": "Explanation for the correct answer (string)",\n  "explanation_origin": "Document or Generated (string)",\n  "difficulty_level": "Difficulty from 1 to 100 (integer)",\n  "law_category_tags": ["Specific law category (string)", "Additional tags as applicable (string)"],\n  "topic": ["Specific topic(s) under the law category (string)", "(string)", "(string)"],\n}\n\nFor Multistate Performance Test (MPT) questions:\n{\n  "Document title": " Title or NA (string)",\n  "Document Date": " Year or NA (integer)",\n  "Publisher": " Name or NA (string)",\n  "question_type": "MPT",\n  "question": "Input question text here (string)",\n  "possible_answers": ["First option (string)", "Second option (string)", "..."],\n  "answer": "Correct answer (string)",\n  "answer_origin": "Document or Generated (string)",\n  "explanation": "Explanation for the correct answer (string)",\n  "explanation_origin": "Document or Generated (string)",\n  "difficulty_level": "Difficulty from 1 to 100 (integer)",\n  "law_category_tags": ["Specific law category (string)", "Additional tags as applicable (string)"],\n  "topic": ["Specific topic(s) under the law category (string)", "(string)", "(string)"],\n}\n\nContext on law area categories (e.g., "Contract Law", "Criminal Law", etc.) and Define topics under each law area (e.g., "Breach of Contract" under Contract Law, "Mens Rea" under Criminal Law):\n\nReference for categories and topics:\n```\n(removed for brevity)\n```\n\n3. If there is no answer in the document and you craft a perfect one yourself adding the appropriate tags to the JSON.\n\nUpon entering data, questions from the current document will be programmatically removed to prevent duplication.\n\nTake a deep breath and think step by step to get the best answer.\n\nCurrent Document:\n```\n{current_document_title}\n{current_document}\n```';

runConversation(content);

// Function to handle each file
async function processFile(filePath) {
  const documentContent = fs.readFileSync(filePath, "utf8");
  const documentTitle = path.basename(filePath, ".txt");
  const promptContent = content
    .replace("{current_document_title}", documentTitle)
    .replace("{current_document}", documentContent);

  const messages = [{ role: "system", content: promptContent }];

  //OpenAI api call
  const response = await openai.chatCompletions.create({
    model: "gpt-4-turbo",
    messages: messages,
    tools: tools,
    tool_choice: "auto", // Allow the AI to choose the tool based on context
  });

  // Handle the function call responses and logging
  handleResponse(response);
}

// Function to handle OpenAI API responses
function handleResponse(response) {
  if (response.choices[0].message.tool_calls) {
    const toolCalls = response.choices[0].message.tool_calls;
    const availableFunctions = {
      insert_mbe_question: logResponse,
      insert_mee_question: logResponse,
      insert_mpt_question: logResponse,
      check_end_of_questions: logResponse,
    };

    toolCalls.forEach((call) => {
      if (availableFunctions[call.name]) {
        availableFunctions[call.name](call.arguments);
      }
    });
  }
}

// Start processing files
const mainFolder = "./path/to/main/folder";
const filesToProcess = readFilesRecursively(mainFolder);

const worker = new ThreadWorker(processFile, {
  maxInactiveTime: 60000,
  async: true,
});

filesToProcess.forEach((file) => worker.run(file));
