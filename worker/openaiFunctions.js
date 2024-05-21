import fs from "fs";
import path from "path";
import OpenAI from "openai";
import {
  insertMBEQuestion,
  insertMEEQuestion,
  insertMPTQuestion,
  end_document_processing,
} from "./supabaseFunctions.js";
import { deleteProcessedContent, cleanUpNewlines } from "./helperFunctions.js";

const openai = new OpenAI({
  organization: "org-1KxJHVsv6ro52UhvmhR8wPPp",
  project: "proj_rLFJj3uw05jwmSk3e1jwz96v",
});

export async function processFile(filePath, parentPort) {
  console.log("Received file path:", filePath);
  const documentTitle = path.basename(filePath, ".txt");
  const documentContent = fs.readFileSync(filePath, "utf8");

  // Defining the tools for the LLM
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
            Doc_Lines_to_Delete: { type: "array", items: { type: "integer" } },
            Document_Date: { type: "string" },
            Publisher: { type: "string" },
            question_type: { type: "string", const: "MBE" },
            question: { type: "string", description: "The entire question from the document to be inserted (may include multiple paragraphs in the root of the question)"},
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
          required: [
            "Document_title",
            "Doc_Lines_to_Delete",
            "Document_Date",
            "Publisher",
            "question_type",
            "question",
            "answers",
            "correct_answer",
            "answer_origin",
            "explanation",
            "explanation_origin",
            "difficulty_level",
            "law_category_tags",
            "topic",
          ],
        },
      },
    },
      // {
      //   type: "function",
      //   function: {
      //     name: "get_current_weather",
      //     description: "Get the current weather in a given location",
      //     parameters: {
      //       type: "object",
      //       properties: {
      //         location: {
      //           type: "string",
      //           description: "The city and state, e.g. San Francisco, CA",
      //         },
      //         unit: { type: "string", enum: ["celsius", "fahrenheit"] },
      //       },
      //       required: ["location"],
      //     },
      //   },
      // },
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
        description:
          "Call when there are no more questions in the document to be added to the database",
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
  
  You have access to four tools. Three are for adding questions to the database: insert_mbe_question, insert_mee_question, and insert_mpt_question. Ensure that you record the lines that you copy from and send them as a parameter to the function via Doc_Lines_to_Delete so that you do not repeat content. The last tool, end_document_processing, is for ending processing of a document once all questions are gone. Ensure that you follow the operational guidelines exactly.
  
  Operational Guidelines:
  
  1. Record your data exactly as it appears in the source document.
  2. Record and list the line numbers of the lines that you copied your content from on the source document to send as Doc_Lines_to_Delete so that you do not repeat content.
  3. Format your response perfectly to fit the structure of the functions that you want to call.
  4. Respond only in JSON and ensure that it is well formatted and valid. No other prose.
  5. Ensure you only make a single tool call for each question. You can do multiple questions in one response via multiple tool calls if it doesn't decrease quality.
  6. Question type can be 'MBE', 'MEE', or 'MPT'. All multiple choice questions are type MBE. Only do MBE questions for now!
  7. If there is no clear data on the document date or publisher, insert the value 'NA'.
  8. If there is an answer for the question in the document ensure that you use it! If there is no answer in the document, ensure that the one you create is perfect and accurate.
  9. Answer origin can be 'Generated' or 'Document'.
  10. If there is an explanation for the answer in the document ensure that you use it! If there is no explanation in the document, ensure that the one you create is clear, concise, and accurate. Don't just state why the correct answer is correct. Go through the thought process, canceling out the other options logically with reasoning why, and conclude your explanation by revealing the correct answer only after the full thought process is complete. If there is an explanation in the document already but does not fit your ideal structure of including the logical thought process, then use it as context to craft your own.
  11. Explanation origin can be 'Generated' or 'Document'.
  12. Difficulty score is out of 100 and is in the context of the average bar exam question being a 50.
  13: When there are no more questions in the document, call the end_document_processing tool with the boolean true. If there are more questions in the document that you were not able to get this time DO NOT call end_document_processing so that you get sent the document again for another round of processing.
  14: Law Categories and topics:[{"category":"CivilProcedure","topics":[{"topic": "Jurisdiction and venue","subtopics":["Federal subject-matter jurisdiction (federal question, diversity, supplemental, and removal)","Personal jurisdiction","Service f process and notice","Venue, forum non conveniens, and transfer"]},{"topic": "Law applied by federal courts","subtopics": ["State law in federal court","Federal common law"]},{"topic": "Pretrial procedures","subtopics": ["Preliminary injunctions and temporary restraining orders","Pleadings and amended and supplemental pleadings","Rule 11",Joinder of parties and claims (including class actions)","Discovery (including e-discovery), disclosure, and sanctions","Adjudication without a trial","Pretrial conference and order"]},{"topic": "Jury trials","subtopics": ["Right to jury trial","Selection and composition of juries","Requests for and objections to jury instructions"]},{"topic": "Motions","subtopics": ["Pretrial motions, including motions addressed to face of pleadings, motions to dismiss, and summary judgment motions",Motions for judgments as a matter of law (directed verdicts and judgments notwithstanding the verdict)","Posttrial motions, including motions for relief from judgment and for new trial"]},{"topic": "Verdicts and judgments","subtopics": ["Defaults and dismissals","Jury verdicts—types and challenges","Judicial findings and conclusions","Effect; claim and issue reclusion"]},{"topic": "Appealability and review","subtopics": ["Availability of interlocutory review","Final judgment rule","Scope of review for judge and jury"]}]},{"category": "Constitutional Law","topics": [{"topic": "The nature of judicial review","subtopics": ["Organization and relationship of state and federal courts in a federal system","Jurisdiction","Judicial review in peration"]},{"topic": "The separation of powers","subtopics": ["The powers of Congress","The powers of the president","Federal interbranch relationships"]},{"topic": "The relation of nation and states in a federal system","subtopics": ["Intergovernmental immunities","Federalism-based limits on state authority"]},{"topic": "Individual rights","subtopics": ["State action","Due process","Equal protection","Takings","Other protections, including the privileges and immunities clauses, he contracts clause, unconstitutional conditions, bills of attainder, and ex post facto laws","First Amendment freedoms"]}]},{"category": "Contracts","topics": [{"topic": "Formation of contracts","subtopics": ["Mutual assent (including offer and acceptance, and unilateral, bilateral, and implied-in-fact contracts)","Indefiniteness and bsence of terms","Consideration (bargained-for exchange)","Obligations enforceable without a bargained-for exchange (including reliance and restitution)","Modification of contracts"]},{"topic": "Defenses to enforceability","subtopics": ["Incapacity to contract","Duress and undue influence","Mistake and misunderstanding","Fraud, misrepresentation, and ondisclosure","Illegality, unconscionability, and public policy","Statute of frauds"]},{"topic": "Contract content and meaning","subtopics": ["Parol evidence","Interpretation","Omitted and implied terms"]},{"topic": "Performance, breach, and discharge","subtopics": ["Conditions (express and constructive)","Excuse of conditions","Breach (including material and partial breach, and nticipatory repudiation)","Obligations of good faith and fair dealing","Express and implied warranties in sale-of-goods contracts","Other performance matters (including cure, identification, notice, and risk of loss)","Impossibility, impracticability, and frustration of purpose","Discharge of duties (including accord and satisfaction, substituted contract, novation, rescission, and release)"]},{"topic": "Remedies","subtopics": ["Expectation interest (including direct, incidental, and consequential damages)","Causation, certainty, and foreseeability",Liquidated damages and penalties, and limitation of remedies","Avoidable consequences and mitigation of damages","Rescission and reformation","Specific performance and injunction","Reliance and restitution interests","Remedial rights of breaching parties"]},{"topic": "Third-party rights","subtopics": ["Third-party beneficiaries","Assignment of rights and delegation of duties"]}]},{"category": "Criminal Law and Procedure","topics": [{"topic": "Homicide","subtopics": ["Intended killings","Unintended killings"]},{"topic": "Other crimes","subtopics": ["Theft and receiving stolen goods","Robbery","Burglary","Assault and battery","Rape; statutory rape","Kidnapping","Arson",Possession offenses"]},{"topic": "Inchoate crimes; parties","subtopics": ["Inchoate offenses","Parties to crime"]},{"topic": "General principles","subtopics": ["Acts and omissions","State of mind","Responsibility","Causation","Justification and excuse"]},{"topic": "Constitutional protection of accused persons","subtopics": ["Arrest, search and seizure","Confessions and privilege against self-incrimination","Lineups and other forms of dentification","Right to counsel","Fair trial and guilty pleas","Double jeopardy","Cruel and unusual punishment","Burdens of proof and persuasion","Appeal and error"]}]},{"category": "Evidence","topics": [{"topic": "Presentation of evidence","subtopics": ["Introduction of evidence","Presumptions","Mode and order","Impeachment, contradiction, and rehabilitation","Proceedings to hich evidence rules apply"]},{"topic": "Relevancy and reasons for excluding relevant evidence","subtopics": ["Probative value","Authentication and identification","Character and related concepts","Expert testimony","Real, emonstrative, and experimental evidence"]},{"topic": "Privileges and other policy exclusions","subtopics": ["Spousal immunity and marital communications","Attorney-client and work product","Physician/psychotherapist-patient","Other rivileges","Insurance coverage","Remedial measures","Compromise, payment of medical expenses, and plea negotiations","Past sexual conduct of a victim"]},{"topic": "Writings, recordings, and photographs","subtopics": ["Requirement of original","Summaries","Completeness rule"]},{"topic": "Hearsay and circumstances of its admissibility","subtopics": ["Definition of hearsay","Present sense impressions and excited utterances","Statements of mental, emotional, or physical ondition","Statements for purposes of medical diagnosis and treatment","Past recollection recorded","Business records","Public records and reports","Learned treatises","Former testimony; depositions","Statements against interest","Other exceptions to the hearsay rule","Right to confront witnesses"]}]},{"category": "Real Property","topics": [{"topic": "Ownership of real property","subtopics": ["Present estates and future interests","Cotenancy","Landlord-tenant law","Special problems"]},{"topic": "Rights in real property","subtopics": ["Restrictive covenants","Easements, profits, and licenses","Fixtures","Zoning (fundamentals other than regulatory taking)"]},{"topic": "Real estate contracts","subtopics": ["Real estate brokerage","Creation and construction","Marketability of title","Equitable conversion (including risk of loss)",Options and rights of first refusal","Fitness and suitability","Merger"]},{"topic": "Mortgages/security devices","subtopics": ["Types of security devices","Security relationships","Transfers","Discharge of the mortgage","Foreclosure"]},{"topic": "Titles","subtopics": ["Adverse possession","Transfer by deed","Transfer by operation of law and by will","Title assurance systems","Special problems including estoppel by deed and judgment and tax liens)"]}]},{"category": "Torts","topics": [{"topic": "Intentional torts","subtopics": ["Harms to the person, such as assault, battery, false imprisonment, and infliction of mental distress; and harms to property nterests, such as trespass to land and chattels, and conversion","Defenses to claims for physical harms"]},{"topic": "Negligence","subtopics": ["The duty question, including failure to act, unforeseeable plaintiffs, and obligations to control the conduct of third arties","The standard of care","Problems relating to proof of fault, including res ipsa loquitur","Problems relating to causation","Limitations on liability and special rules of liability","Liability for acts of others","Defenses"]},{"topic": "Strict liability and products liability","subtopics": ["Common law strict liability, including claims arising from abnormally dangerous activities, and defenses to such claims; laims against manufacturers and other defendants arising out of the manufacture and distribution of products, and defenses to such claims"]},{"topic": "Other torts","subtopics": ["Claims based on nuisance, and defenses","Claims based on defamation and invasion of privacy, defenses, and constitutional imitations","Claims based on misrepresentations, and defenses","Claims based on intentional interference with business relations, and defenses"]}]}]
  
  Current Document:
  Title: ${documentTitle}
  Content: ${documentContent}

IMPORTANT:
  MAKE SURE TO INCLUDE ALL RELEVANT CONTEXT AND INFORMATION FROM THE DOCUMENT WHEN EXTRACTING EACH QUESTION. NOTE THAT THIS DATA MAY BE SEPARATED INTO MULTIPLE PARAGRAPHS BEFORE THE FINAL QUESTION (STEM) - INCLUDE IT IN THE QUESTION FIELD AS YOU ARE AN EXCELLENT, DISCERNING QUESTION EXTRACTOR.

  ONLY TAKE QUESTIONS THAT COME DIRECTLY FROM THE DOCUMENT AND IF THERE ARE NO QUESTIONS LEFT, THEN USE THE TOOL CALL end_document_processing().
  
  Take a deep breath and think step by step to get the best answer.`;

  const messages = [{ role: "system", content: promptContent }];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
      tools: tools,
      tool_choice: "required",
    });

    const response_message = response.choices[0].message;
    console.log("response_message:", response);

    const tool_calls = response_message.tool_calls;
    console.log("tool_calls:", tool_calls);

    await handleResponse(tool_calls, filePath, parentPort);

    return {
      status: "success",
      reprocess: !tool_calls.some(
        (call) => call.function.name === "end_document_processing",
      ),
      filePath,
    };
  } catch (error) {
    console.error("Error:", error);
    return { status: "error", message: error.message };
  }
}

export async function handleResponse(tool_calls, filePath, parentPort) {
  console.log("Handling response...");
  console.log(`Processing ${tool_calls.length} tool calls`);

  const availableFunctions = {
    insert_mbe_question: insertMBEQuestion,
    insert_mee_question: insertMEEQuestion,
    insert_mpt_question: insertMPTQuestion,
    end_document_processing: end_document_processing,
  };

  const tasks = tool_calls.map((tool_call) => {
    const functionName = tool_call.function.name;
    const functionToCall = availableFunctions[functionName];
    if (functionToCall) {
      try {
        const functionArgs = tool_call.function.arguments;
        console.log(
          `Parsing arguments for function ${functionName}:`,
          functionArgs,
        );
        const parsedArgs =
          typeof functionArgs === "string"
            ? JSON.parse(functionArgs)
            : functionArgs;
        cleanUpNewlines(parsedArgs);

        return functionToCall(parsedArgs, filePath)
          .then((response) =>
            console.log(`Response from ${functionName}:`, response),
          )
          .catch((error) =>
            console.error(`Error during ${functionName} call:`, error),
          );
      } catch (error) {
        console.error("Error parsing function arguments:", error);
      }
    } else {
      console.warn(`Function ${functionName} not found`);
    }
    return Promise.resolve(`Function ${functionName} not found`);
  });

  await Promise.all(tasks);
  console.log("All tool calls processed.");

  // Determine if the document processing is complete or needs reprocessing
  const reprocess = !tool_calls.some(
    (call) => call.function.name === "end_document_processing",
  );
  parentPort.postMessage({
    status: "success",
    result: tool_calls,
    reprocess,
    filePath,
  });
}
