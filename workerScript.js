import { parentPort } from "worker_threads";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpazmihhssffmeyfmsey.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwYXptaWhoc3NmZm1leWZtc2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MDIzMjEsImV4cCI6MjAyOTA3ODMyMX0.a8nrDdTF5pVh_LKmSAZNCcq83CjIMIf7gO0dH1nMnj0';
const supabase = createClient(supabaseUrl, supabaseKey);

function deleteProcessedContent(filePath, contentToDelete) {
  try {
    let fileContent = fs.readFileSync(filePath, "utf8");
    fileContent = fileContent.replace(contentToDelete, "");
    fs.writeFileSync(filePath, fileContent, "utf8");
    console.log(`Processed content removed from file: ${filePath}`);
  } catch (error) {
    console.error(`Error removing processed content from file: ${error.message}`);
    throw error;
  }
}


async function insertMBEQuestion(args, filePath) {
  try {
    console.log('Inserting MBE question with args:', args);
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    const {
      Document_title,
      Document_Date,
      Publisher,
      question_type,
      question,
      answers,
      correct_answer,
      answer_origin,
      explanation,
      explanation_origin,
      difficulty_level,
      law_category_tags,
      topic,
    } = parsedArgs;

    cleanUpNewlines(parsedArgs);

    // Construct the content to delete from the file
    const contentToDelete = `${question}\n${answers.A}\n${answers.B}\n${answers.C}\n${answers.D}\n${explanation}\n`;

    // Remove processed content from the file
    deleteProcessedContent(filePath, contentToDelete);

    console.log('Calling Supabase function with:', {
      _answer_origin: answer_origin,
      _answers: answers,
      _correct_answer: correct_answer,
      _difficulty_level: difficulty_level,
      _document_date: Document_Date,
      _document_title: Document_title,
      _explanation: explanation,
      _explanation_origin: explanation_origin,
      _law_category_tags: law_category_tags,
      _publisher: Publisher,
      _question: question,
      _question_type: question_type,
      _topic: topic,
    });

    const { data, error } = await supabase.rpc('insert_mbe_question', {
      _answer_origin: answer_origin,
      _answers: answers,
      _correct_answer: correct_answer,
      _difficulty_level: difficulty_level,
      _document_date: Document_Date,
      _document_title: Document_title,
      _explanation: explanation,
      _explanation_origin: explanation_origin,
      _law_category_tags: law_category_tags,
      _publisher: Publisher,
      _question: question,
      _question_type: question_type,
      _topic: topic,
    });

    if (error) {
      console.error('Error inserting MBE question:', error);
      throw error;
    }

    console.log('MBE question inserted successfully');
    return data;
  } catch (error) {
    console.error('Error processing MBE question args:', error);
    throw error;
  }
}

async function insertMEEQuestion(args, filePath) {
  try {
    console.log('Inserting MEE question with args:', args);
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    const {
      Document_title,
      Document_Date,
      Publisher,
      question_type,
      question,
      possible_answers,
      answer,
      answer_origin,
      explanation,
      explanation_origin,
      difficulty_level,
      law_category_tags,
      topic,
    } = parsedArgs;

    cleanUpNewlines(parsedArgs);

    // Construct the content to delete from the file
    const contentToDelete = `${question}\n${possible_answers.join('\n')}\n${answer}\n${explanation}\n`;

    // Remove processed content from the file
    deleteProcessedContent(filePath, contentToDelete);

    // Call the Supabase function
    console.log('Calling Supabase function with:', {
      _answer_origin: answer_origin,
      _answers: possible_answers,
      _correct_answer: answer,
      _difficulty_level: difficulty_level,
      _document_date: Document_Date,
      _document_title: Document_title,
      _explanation: explanation,
      _explanation_origin: explanation_origin,
      _law_category_tags: law_category_tags,
      _publisher: Publisher,
      _question: question,
      _question_type: question_type,
      _topic: topic,
    });

    const { data, error } = await supabase.rpc('insert_mee_question', {
      _answer_origin: answer_origin,
      _answers: possible_answers,
      _correct_answer: answer,
      _difficulty_level: difficulty_level,
      _document_date: Document_Date,
      _document_title: Document_title,
      _explanation: explanation,
      _explanation_origin: explanation_origin,
      _law_category_tags: law_category_tags,
      _publisher: Publisher,
      _question: question,
      _question_type: question_type,
      _topic: topic,
    });

    if (error) {
      console.error('Error inserting MEE question:', error);
      throw error;
    }

    console.log('MEE question inserted successfully');
    return data;
  } catch (error) {
    console.error('Error processing MEE question args:', error);
    throw error;
  }
}

async function insertMPTQuestion(args, filePath) {
  try {
    console.log('Inserting MPT question with args:', args);
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    const {
      Document_title,
      Document_Date,
      Publisher,
      question_type,
      question,
      possible_answers,
      answer,
      answer_origin,
      explanation,
      explanation_origin,
      difficulty_level,
      law_category_tags,
      topic,
    } = parsedArgs;

    cleanUpNewlines(parsedArgs);

    // Construct the content to delete from the file
    const contentToDelete = `${question}\n${possible_answers.join('\n')}\n${answer}\n${explanation}\n`;

    // Remove processed content from the file
    deleteProcessedContent(filePath, contentToDelete);

    // Call the Supabase function
    console.log('Calling Supabase function with:', {
      _answer_origin: answer_origin,
      _answers: possible_answers,
      _correct_answer: answer,
      _difficulty_level: difficulty_level,
      _document_date: Document_Date,
      _document_title: Document_title,
      _explanation: explanation,
      _explanation_origin: explanation_origin,
      _law_category_tags: law_category_tags,
      _publisher: Publisher,
      _question: question,
      _question_type: question_type,
      _topic: topic,
    });

    const { data, error } = await supabase.rpc('insert_mpt_question', {
      _answer_origin: answer_origin,
      _answers: possible_answers,
      _correct_answer: answer,
      _difficulty_level: difficulty_level,
      _document_date: Document_Date,
      _document_title: Document_title,
      _explanation: explanation,
      _explanation_origin: explanation_origin,
      _law_category_tags: law_category_tags,
      _publisher: Publisher,
      _question: question,
      _question_type: question_type,
      _topic: topic,
    });

    if (error) {
      console.error('Error inserting MPT question:', error);
      throw error;
    }

    console.log('MPT question inserted successfully');
    return data;
  } catch (error) {
    console.error('Error processing MPT question args:', error);
    throw error;
  }
}


const openai = new OpenAI({
  organization: "org-1KxJHVsv6ro52UhvmhR8wPPp",
  project: "proj_rLFJj3uw05jwmSk3e1jwz96v",
});

async function processFile(filePath) {
  console.log("Received file path:", filePath);
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
            Document_title: { type: "string" },
            Document_Date: { type: "string" },
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
          required: ["Document_title", "Document_Date", "question_type", "question", "answers", "correct_answer", "answer_origin", "explanation", "explanation_origin", "difficulty_level", "law_category_tags", "topic" ],
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
            "Document Date": { type: "string" },
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
            "Document Date": { type: "string" },
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
        name: "end_document_processing",
        description: "Call when there are no more questions in the document to be added to the database",
        parameters: {
          type: "object",
          properties: {
              end_document_processing: { type: "boolean" },
          },
          required: ["end_document_processing"],
        },
      },
    },
  ];

  // Construct the prompt using template literals
  const promptContent = `You are a coveted AI legal expert who is a bar exam master and gets a perfect score on every question. You have been designed to assist in the organization and management of bar exam study materials. Your current task is to format, validate, and load various types of legal questions into a structured database.

You have access to four tools. Three are for adding questions to the database: insert_mbe_question, insert_mee_question, and insert_mpt_question. Questions will automatically be deleted from the source document as you add them to the database. The last tool, end_document_processing, is for ending processing of a document once all questions are gone. Ensure that you follow the operational guidelines exactly.

Operational Guidelines:

1. Record your data exactly as it appears in the source document.
2. Format your response perfectly to fit the structure of the functions that you want to call.
3. Respond only in JSON and ensure that it is well formatted and valid. No other prose.
4. Ensure you only make a single tool call for each question. You can do multiple questions in one response via multiple tool calls if it doesn't decrease quality.
5. Question type can be 'MBE', 'MEE', or 'MPT'.
6. If there is no clear data on the document date or publisher, put 'NA'.
7. If there is no answer in the document, ensure that the one you create is perfect and accurate.
8. Answer origin can be 'Generated' or 'Document'.
9. If there is no explanation in the document, ensure that the one you create is clear, concise, and accurate. Don't just state why the correct answer is correct. Go through the thought process, canceling out the other options logically with reasoning why, and conclude your explanation by revealing the correct answer only after the full thought process is complete. If there is an explanation in the document already but does not fit your ideal structure of including the logical thought process, then use it as context to craft your own.
10. Explanation origin can be 'Generated' or 'Document'.
11. Difficulty score is out of 100 and is in the context of the average bar exam question being a 50.
12. The law category tags can be any of the following:
13. The topic tags can be any of the following:
14: When there are no more questions in the document, call the end_document_processing tool with the boolean true. 

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

      const response_message = response.choices[0].message;
      console.log("response_message:", response);

      const tool_calls = response_message.tool_calls;
      console.log("tool_calls:", tool_calls);

      await handleResponse(tool_calls, filePath);
      parentPort.postMessage({ status: "success", result: tool_calls });
      } catch (error) {
      console.error("Error:", error);
      parentPort.postMessage({ status: "error", message: error.message });
      }
      }


async function handleResponse(tool_calls, filePath) {
  console.log("Handling response...");
  console.log(`Processing ${tool_calls.length} tool calls`);

  const availableFunctions = {
    insert_mbe_question: insertMBEQuestion,
    insert_mee_question: insertMEEQuestion,
    insert_mpt_question: insertMPTQuestion,
    end_document_processing: end_document_processing,
  };

  const tasks = tool_calls.map(tool_call => {
    const functionName = tool_call.function.name;
    const functionToCall = availableFunctions[functionName];
    if (functionToCall) {
      try {
        const functionArgs = tool_call.function.arguments;
        console.log(`Parsing arguments for function ${functionName}:`, functionArgs);
        const parsedArgs = typeof functionArgs === 'string' ? JSON.parse(functionArgs) : functionArgs;
        cleanUpNewlines(parsedArgs);

        return functionToCall(parsedArgs, filePath)
          .then(response => console.log(`Response from ${functionName}:`, response))
          .catch(error => console.error(`Error during ${functionName} call:`, error));
      } catch (error) {
        console.error('Error parsing function arguments:', error);
      }
    } else {
      console.warn(`Function ${functionName} not found`);
    }
    return Promise.resolve(`Function ${functionName} not found`);
  });

  await Promise.all(tasks);
  console.log('All tool calls processed.');
}

  // async function insertMEEQuestion(args) {
  //   console.log("Inserting MEE question with args:", args);
  //   return new Promise(resolve => setTimeout(() => resolve("MEE question inserted"), 1000));
  // }

  // async function insertMPTQuestion(args) {
  //   console.log("Inserting MPT question with args:", args);
  //   return new Promise(resolve => setTimeout(() => resolve("MPT question inserted"), 1000));
  // }

async function end_document_processing({ end_document_processing }) {
  try {
    if (!end_document_processing) {
      throw new Error("Invalid argument: end_document_processing must be true to signify the end of document processing.");
    }

    // Log the completion
    console.log("Document processing completed.");

    // Perform any necessary cleanup
    const logFilePath = path.resolve(__dirname, "processing_log.txt");
    fs.appendFileSync(logFilePath, `Document processed at ${new Date().toISOString()}\n`);

    // Optional: Notify any other systems or admins if necessary (e.g., send an email or webhook)

    console.log('Document processing logged successfully');
    return "Document processing logged successfully";
  } catch (error) {
    console.error("Error in end_document_processing:", error);
    throw error;
  }
}

  function cleanUpNewlines(args) {
    for (const key in args) {
      if (typeof args[key] === 'string') {
        args[key] = args[key].replace(/\n/g, ' '); // Replace newline characters with spaces
      }
    }
  }

  parentPort.on('message', async (filePath) => {
    try {
      const result = await processFile(filePath);
      parentPort.postMessage({ message: result });
    } catch (error) {
      parentPort.postMessage({ error: error.message });
    }
  });
