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
