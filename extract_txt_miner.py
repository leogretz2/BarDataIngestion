from pdfminer.high_level import extract_text


def extract_text_from_pdf(pdf_path):
  try:
    text = extract_text(pdf_path)
    return text
  except Exception as e:
    return f"Error extracting text: {str(e)}"


# Usage:
pdf_path_question = './working_folder/NCBE_Online_MBE_Practice_Exam_4/NCBE_Online_MBE_Practice_Exam_4_Questions.pdf'
pdf_path_answer = './working_folder/NCBE_Online_MBE_Practice_Exam_4/NCBE_Online_MBE_Practice_Exam_4_Answers.pdf'
extracted_text_question = extract_text_from_pdf(pdf_path_question)
extracted_text_answer = extract_text_from_pdf(pdf_path_answer)
print(extracted_text_question[:100])
txt_path = './txt_folder/NCBE_Online_MBE_Practice_Exam_4.txt'

with open(txt_path, 'w') as f:
  f.write(extracted_text_question+extracted_text_answer)
  print(f"Combined text saved to {txt_path}")
