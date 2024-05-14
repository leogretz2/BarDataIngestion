import { createClient } from '@supabase/supabase-js';
import { deleteProcessedContent, cleanUpNewlines } from "./helperFunctions.js";

const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY
const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_API_KEY);


export async function insertMBEQuestion(args, filePath) {
  try {
    console.log('Inserting MBE question with args:', args);
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    const {
      Document_title,
      Doc_Lines_to_Delete,
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

    // Remove processed content from the file
    deleteProcessedContent(filePath, Doc_Lines_to_Delete);

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

export async function insertMEEQuestion(args, filePath) {
  try {
    console.log('Inserting MEE question with args:', args);
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    const {
      Document_title,
      Doc_Lines_to_Delete,
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

    // Remove processed content from the file
    deleteProcessedContent(filePath, Doc_Lines_to_Delete);

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

export async function insertMPTQuestion(args, filePath) {
  try {
    console.log('Inserting MPT question with args:', args);
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    const {
      Document_title,
      Doc_Lines_to_Delete,
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

    // Remove processed content from the file
    deleteProcessedContent(filePath, Doc_Lines_to_Delete);

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

export async function end_document_processing({ end_document_processing }) {
    try {
        if (!end_document_processing) {
            throw new Error("Invalid argument: end_document_processing must be true to signify the end of document processing.");
        }

        console.log("Document processing completed.");
        console.log('Document processing logged successfully');
        return "Document processing logged successfully";
    } catch (error) {
        console.error("Error in end_document_processing:", error);
        throw error;
    }
}
