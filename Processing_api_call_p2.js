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
//nmp install openai

//imports
import OpenAI from "openai";

const openai = new OpenAI({
  organization: 'org-1KxJHVsv6ro52UhvmhR8wPPp',
  project: 'proj_rLFJj3uw05jwmSk3e1jwz96v',
});

const fs = require('fs');
const path = require('path');
const { ThreadWorker } = require('poolifier');

// Helper function to read all text files recursively from a given directory
function readFilesRecursively(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = readFilesRecursively(filepath, filelist);
    } else if (filepath.endsWith('.txt')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

// Function to handle API responses and log completion or errors
function logResponse(data) {
  console.log("Response from API: ", JSON.stringify(data));
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
          "Publisher": { type: "string" },
          "question_type": { type: "string", const: "MBE" },
          "question": { type: "string" },
          "answers": {
            type: "object",
            properties: {
              "A": { type: "string" },
              "B": { type: "string" },
              "C": { type: "string" },
              "D": { type: "string" }
            },
          },
          "correct_answer": { type: "string" },
          "answer_origin": { type: "string" },
          "explanation": { type: "string" },
          "explanation_origin": { type: "string" },
          "difficulty_level": { type: "integer" },
          "law_category_tags": { type: "array", items: { type: "string" } },
          "topic": { type: "array", items: { type: "string" } },
        },
        required: ["question_type", "question", "answers", "correct_answer"]
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
          "Publisher": { type: "string" },
          "question_type": { type: "string", const: "MEE" },
          "question": { type: "string" },
          "possible_answers": { type: "array", items: { type: "string" } },
          "answer": { type: "string" },
          "answer_origin": { type: "string" },
          "explanation": { type: "string" },
          "explanation_origin": { type: "string" },
          "difficulty_level": { type: "integer" },
          "law_category_tags": { type: "array", items: { type: "string" } },
          "topic": { type: "array", items: { type: "string" } },
        },
        required: ["question_type", "question", "answer"]
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
          "Publisher": { type: "string" },
          "question_type": { type: "string", const: "MPT" },
          "question": { type: "string" },
          "possible_answers": { type: "array", items: { type: "string" } },
          "answer": { type: "string" },
          "answer_origin": { type: "string" },
          "explanation": { type: "string" },
          "explanation_origin": { type: "string" },
          "difficulty_level": { type: "integer" },
          "law_category_tags": { type: "array", items: { type: "string" } },
          "topic": { type: "array", items: { type: "string" } },
        },
        required: ["question_type", "question", "answer"]
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
          "end_of_questions": { type: "boolean" }
        },
        required: ["end_of_questions"],
      },
    },
  }
];

// Function to process each file
async function processFile(filePath) {
  try {
    
    // Read the content of the file
    const documentTitle = path.basename(filePath, '.txt');
    
    // Extract the title from the file path, removing the file extension
    const documentContent = fs.readFileSync(filePath, 'utf8');

    // Construct the prompt using template literals
    const promptContent = `You are an AI designed to assist in the organization and management of bar exam study materials. Your current task is to format, validate, and load various types of legal questions into a structured database. You are a coveted legal expert who is a bar exam master and gets a perfect score on every question

    Operational Guidelines:
    1. Address one question at a time for accuracy.
    2. Employ the following structured formats for data entry:

    For Multistate Bar Examination (MBE) questions:
    {
      "Document title": "${documentTitle}",
      "Document Date": " Year or NA (integer)",
      "Publisher": " Name or NA (string)",
      "question_type": "MBE",
      "question": "Input question text here (string)",
      "answers": {
        "A": "First option (string)",
        "B": "Second option (string)",
        "C": "Third option (string)",
        "D": "Fourth option (string)"
      },
      "correct_answer": "Correct option letter (string)",
      "answer_origin": "Document or Generated (string)",
      "explanation": "Explanation for the correct answer (string)",
      "explanation_origin": "Document or Generated (string)",
      "difficulty_level": "Difficulty from 1 to 100 (integer)",
      "law_category_tags": ["Specific law category (string)", "Additional tags as applicable (string)"],
      "topic": ["Specific topic(s) under the law category (string)", "(string)", "(string)"],
    }

    For Multistate Essay Examination (MEE) questions:
    {
      "Document title": "${documentTitle}",
      "Document Date": " Year or NA (integer)",
      "Publisher": " Name or NA (string)",
      "question_type": "MEE",
      "question": "Input question text here (string)",
      "possible_answers": ["First option (string)", "Second option (string)", "..."],
      "answer": "Correct answer (string)",
      "answer_origin": "Document or Generated (string)",
      "explanation": "Explanation for the correct answer (string)",
      "explanation_origin": "Document or Generated (string)",
      "difficulty_level": "Difficulty from 1 to 100 (integer)",
      "law_category_tags": ["Specific law category (string)", "Additional tags as applicable (string)"],
      "topic": ["Specific topic(s) under the law category (string)", "(string)", "(string)"],
    }

    For Multistate Performance Test (MPT) questions:
    {
      "Document title": "${documentTitle}",
      "Document Date": " Year or NA (integer)",
      "Publisher": " Name or NA (string)",
      "question_type": "MPT",
      "question": "Input question text here (string)",
      "possible_answers": ["First option (string)", "Second option (string)", "..."],
      "answer": "Correct answer (string)",
      "answer_origin": "Document or Generated (string)",
      "explanation": "Explanation for the correct answer (string)",
      "explanation_origin": "Document or Generated (string)",
      "difficulty_level": "Difficulty from 1 to 100 (integer)",
      "law_category_tags": ["Specific law category (string)", "Additional tags as applicable (string)"],
      "topic": ["Specific topic(s) under the law category (string)", "(string)", "(string)"],
    }

    Current Document:
    ${documentContent}`;

    const messages = [{ role: "system", content: promptContent }];

    // OpenAI API call
    const response = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      tools: tools,
      tool_choice: "required", // Make the AI use a tool
    });

    // Check and log the structure of the response for debugging
    console.log(response);

    // Handle the function call responses
    handleResponse(response);
  } catch (error) {
    console.error('Error processing file:', filePath, error);
  }
}

// Function to handle responses from the OpenAI API
function handleResponse(response) {
  // Assuming response structure matches your setup or API documentation
  const toolCalls = response.choices[0].message.tool_calls;

  if (toolCalls) {
    const availableFunctions = {
      insert_mbe_question: insertMBEQuestion,
      insert_mee_question: insertMEEQuestion,
      insert_mpt_question: insertMPTQuestion,
      check_end_of_questions: checkEndOfQuestions
    };

    toolCalls.forEach(call => {
      const functionName = call.function.name;
      const functionArgs = call.arguments;  

      if (availableFunctions[functionName]) {
        // Dynamically call the function based on the tool call
        availableFunctions[functionName](functionArgs);
      } else {
        console.error("Function not found for tool call:", functionName);
      }
    });
  }
}

// Start processing files
const mainFolder = './pre-processed_folder_test';
const filesToProcess = readFilesRecursively(mainFolder);
const worker = new ThreadWorker(processFile, {
  maxInactiveTime: 60000,
  async: true,
});

filesToProcess.forEach(file => worker.run(file));