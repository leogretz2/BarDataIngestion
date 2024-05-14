from pdfminer.high_level import extract_text
import docx

import fitz  # PyMuPDF
import pytesseract
import io
from PIL import Image
import numpy as np
import cv2


def extract_text_from_pdf(pdf_path):
  try:
    text = extract_text(pdf_path)
    return text
  except Exception as e:
    return f"Error extracting text: {str(e)}"


def extract_text_from_docx(file_path):
  doc = docx.Document(file_path)
  return "\n".join([paragraph.text for paragraph in doc.paragraphs])


def extract_text_from_images_pdf(pdf_path):
  pdf = fitz.open(pdf_path)
  extracted_text = ''

  for page_number, page in enumerate(pdf, start=1):
    image_list = page.get_images(full=True)
    for img_index, img_tuple in enumerate(image_list):
      xref = img_tuple[0]
      base_image = pdf.extract_image(xref)
      img_bytes = base_image['image']
      image_length = len(img_bytes)
      print(f"Page {page_number}, Image {img_index}: {image_length} bytes")

      # Check if the byte length is zero
      if image_length == 0:
        print(f"No data found for image {img_index} on page {page_number}")
        continue

      # Attempt to decode the image
      nparr = np.frombuffer(img_bytes, np.uint8)
      img_cv = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

      # Verify the image was correctly decoded
      if img_cv is None or img_cv.size == 0:
        print(f"Failed to decode image {img_index} on page {page_number}")
        continue

      # Convert the image to a PIL Image for use with pytesseract
      if len(img_cv.shape) == 2:  # Grayscale image
        pil_image = Image.fromarray(img_cv)
      elif len(img_cv.shape) == 3:  # Color image
        pil_image = Image.fromarray(cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB))
      else:
        print(
            f"Unsupported image format for image {img_index} on page {page_number}"
        )
        continue

      # Extract text using pytesseract
      extracted_text += '\n' + pytesseract.image_to_string(
          pil_image, lang='eng')

  pdf.close()
  return extracted_text


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
elif False:
  # one-off file
  pdf_path = './working_folder/300_MBE_QAs.pdf'
  print('about to extract')
  extracted_text = extract_text_from_pdf(pdf_path)
  print(extracted_text[:100], '\n', extracted_text[-100:])

  txt_path = './txt_folder/300_MBE_QAs.txt'
else:
  # OCR
  pdf_path = './working_folder/Barbri_Released_Questions_MBE_2007.pdf'
  extracted_text = extract_text_from_images_pdf(pdf_path)
  txt_path = './txt_folder/Barbri_Released_Questions_MBE_2007.txt'

with open(txt_path, 'w') as f:
  f.write(extracted_text)
  print(f"Combined text saved to {txt_path}")

def replace_newlines(filename):
  # Read the content from the file
  with open(filename, 'r') as file:
      content = file.read()

  # Replace three or more newline characters with two newline characters
  import re
  modified_content = re.sub(r'\n{3,}', '\n\n', content)

  # Write the modified content back to the file
  with open(filename, 'w') as file:
      file.write(modified_content)

# Usage
filename = './txt_folder/Torts.txt'
replace_newlines(filename)

