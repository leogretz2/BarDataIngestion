import { parentPort } from "worker_threads";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  organization: "org-1KxJHVsv6ro52UhvmhR8wPPp",
  project: "proj_rLFJj3uw05jwmSk3e1jwz96v",
});

async function processFile(filePath) {
  console.log("Received file path:", filePath); // Check what you receive
  const documentTitle = path.basename(filePath, ".txt");
  const documentContent = fs.readFileSync(filePath, "utf8");

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

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      tools: tools,
      tool_choice: "required",
    });

    // Handle the function call responses
    handleResponse(response);
    parentPort.postMessage({ status: "success", result: response.data });
  } catch (error) {
    console.error("Error processing file:", filePath, error);
    parentPort.postMessage({ status: "error", message: error.message });
  }
}

function handleResponse(response) {
  // Assuming response structure matches your setup or API documentation
  const toolCalls = response.choices[0].message.tool_calls;

  if (toolCalls) {
    toolCalls.forEach((call) => {
      const functionName = call.function.name;
      const functionArgs = call.arguments;
      const handler = availableFunctions[functionName];

      if (handler) {
        handler(functionArgs);
      } else {
        console.error("Function not found for tool call:", functionName);
      }
    });
  }
}

const availableFunctions = {
  insert_mbe_question: insertMBEQuestion,
  insert_mee_question: insertMEEQuestion,
  insert_mpt_question: insertMPTQuestion,
  check_end_of_questions: checkEndOfQuestions,
};

// Example implementations for the functions
function insertMBEQuestion(args) {
  console.log("Inserting MBE question:", args);
}

function insertMEEQuestion(args) {
  console.log("Inserting MEE question:", args);
}

function insertMPTQuestion(args) {
  console.log("Inserting MPT question:", args);
}

function checkEndOfQuestions(args) {
  console.log("End of questions:", args);
}

// Listening for messages from the parent thread
parentPort.on('message', async (task) => {
  console.log("Received task:", task); // Debugging the structure of the received task
  if (!task || !task.filePath) {
    console.error("No file path provided");
    return;
  }
  await processFile(task.filePath);
});
