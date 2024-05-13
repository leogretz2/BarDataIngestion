from pdfminer.high_level import extract_text
import docx


def extract_text_from_pdf(pdf_path):
  try:
    text = extract_text(pdf_path)
    return text
  except Exception as e:
    return f"Error extracting text: {str(e)}"


def extract_text_from_docx(file_path):
  doc = docx.Document(file_path)
  return "\n".join([paragraph.text for paragraph in doc.paragraphs])


# Usage:
if False:
  # folder, two files
  docx_path_question = './working_folder/Torts/Torts_Questions.docx'
  docx_path_answer = './working_folder/Torts/Torts_Answers.docx'
  extracted_text_question = extract_text_from_docx(docx_path_question)
  extracted_text_answer = extract_text_from_docx(docx_path_answer)
  #pdf_path_question = './working_folder/NCBE_Online_MBE_Practice_Exam_4/NCBE_Online_MBE_Practice_Exam_4_Questions.pdf'
  #pdf_path_answer = './working_folder/NCBE_Online_MBE_Practice_Exam_4/NCBE_Online_MBE_Practice_Exam_4_Answers.pdf'
  # extracted_text_question = extract_text_from_pdf(pdf_path_question)
  # extracted_text_answer = extract_text_from_pdf(pdf_path_answer)
  print('q: ', extracted_text_question[:100], '\n',
        extracted_text_question[-100:], '\n\na: ', extracted_text_answer[:100],
        '\n', extracted_text_answer[-100:])
  extracted_text = extracted_text_question + '\n\n' + extracted_text_answer
  title = 'Torts'
  txt_path = f'./txt_folder/{title}_folder.txt'
else:
  # one-off file
  pdf_path = './working_folder/MBE_Strategies_and_Tactics_II_2C_Second_Edition_28Emanuel_Bar_Review_Ser.pdf'
  print('about to extract')
  extracted_text = extract_text_from_pdf(pdf_path)
  print(extracted_text[:100], '\n', extracted_text[-100:])

  txt_path = './txt_folder/MBE_Strategies_and_Tactics_II_2C_Second_Edition_28Emanuel_Bar_Review_Ser.txt'

with open(txt_path, 'w') as f:
  f.write(extracted_text)
  print(f"Combined text saved to {txt_path}")
