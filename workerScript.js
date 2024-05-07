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
  const promptContent = `You are an AI designed to assist in the organization and management of bar exam study materials. Your current task is to format, validate, and load various types of legal questions into a structured database. You are a coveted legal expert who is a bar exam master and gets a perfect score on every question.

        Operational Guidelines:
        1. Address one question at a time for accuracy.
        2. Format your response exactly to fit the structure the functions you want to call require.
        3. Respond only in JSON and ensure that it is well formatted and valid.

        Current Document:
        Title: ${documentTitle}
        Content: ${documentContent}
        
        Take a deep breath and think step by step to get the best answer.`;

  const messages = [{ role: "system", content: promptContent }];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      response_format: { type: "json_object" },
      tools: tools,
      tool_choice: "required",
    });

    const response_message = response.choices[0].message
    console.log("response_message:", response);
    
    const tool_calls = response_message.tool_calls
    console.log("too_calls:", tool_calls);

    handleResponse(tool_calls);
    parentPort.postMessage({ status: "success", result: tool_calls });
  } catch (error) {
    console.error("Error:", error);
    parentPort.postMessage({ status: "error", message: error.message });
  }
}

async function handleResponse(tool_calls) {
  console.log("Handling response...");

  const availableFunctions = {
    insert_mbe_question: insertMBEQuestion,
    insert_mee_question: insertMEEQuestion,
    insert_mpt_question: insertMPTQuestion,
    check_end_of_questions: checkEndOfQuestions,
  };

  try {
    for (const tool_call of tool_calls) {
      const functionName = tool_call.function.name;
      const functionToCall = availableFunctions[functionName];
      if (functionToCall) {
        const functionArgs = JSON.parse(tool_call.function.arguments);
        const functionResponse = await functionToCall(functionArgs);
        console.log(`Response from ${functionName}:`, functionResponse);
      } else {
        console.log(`Function ${functionName} not found`);
      }
      }
  } catch (error) {
    console.error("Error during function call:", error);
  }
}

// Example implementation for the functions
async function insertMBEQuestion(args) {
  console.log("Inserting MBE question with args:", args);
  // Example async operation
  return new Promise(resolve => setTimeout(() => resolve("MBE question inserted"), 1000));
}

async function insertMEEQuestion(args) {
  console.log("Inserting MEE question with args:", args);
  return new Promise(resolve => setTimeout(() => resolve("MEE question inserted"), 1000));
}

async function insertMPTQuestion(args) {
  console.log("Inserting MPT question with args:", args);
  return new Promise(resolve => setTimeout(() => resolve("MPT question inserted"), 1000));
}

function checkEndOfQuestions(args) {
  console.log("Checking end of questions with args:", args);
  return "End of questions checked";
}

// Listening for messages from the parent thread
parentPort.on('message', async (filePath) => {
  try {
    const result = await processFile(filePath);
    parentPort.postMessage({ message: result });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});