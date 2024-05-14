# from pdfminer.high_level import extract_text
import docx
import fitz  # PyMuPDF
import pytesseract
import io
from PIL import Image
import numpy as np
import cv2


# def extract_text_from_pdf(pdf_path):
#     try:
#         text = extract_text(pdf_path)
#         return text
#     except Exception as e:
#         return f"Error extracting text: {str(e)}"


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

            if image_length == 0:
                print(f"No data found for image {img_index} on page {page_number}")
                continue

            nparr = np.frombuffer(img_bytes, np.uint8)
            img_cv = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

            if img_cv is None or img_cv.size == 0:
                print(f"Failed to decode image {img_index} on page {page_number}")
                continue

            if len(img_cv.shape) == 2:  # Grayscale image
                pil_image = Image.fromarray(img_cv)
            elif len(img_cv.shape) == 3:  # Color image
                pil_image = Image.fromarray(cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB))
            else:
                print(f"Unsupported image format for image {img_index} on page {page_number}")
                continue

            extracted_text += '\n' + pytesseract.image_to_string(pil_image, lang='eng')

    pdf.close()
    return extracted_text


def add_line_numbers(text):
    lines = text.split('\n')
    numbered_lines = [(f"(Line_{index:04}): {line}" if line else line) for index, line in enumerate(lines, 1)]
    return "\n".join(numbered_lines)

def main():
    # If doc is docx, separate question and answer in folder
    if False:
        docx_path_question = './working_folder/Con_Law/Con_law_answers.docx'
        docx_path_answer = './working_folder/Con_Law/Con_law_questions.docx'
        extracted_text_question = add_line_numbers(extract_text_from_docx(docx_path_question))
        extracted_text_answer = add_line_numbers(extract_text_from_docx(docx_path_answer))
        extracted_text = extracted_text_question + '\n\n' + extracted_text_answer
    # If doc is pdf and word count > 50 (aka has selectable text) use pdfminer.high_level
    elif False:
        pdf_path = ''
        extracted_text = add_line_numbers(extract_text_from_pdf(pdf_path))
    # If doc is  pdf and word count < 50 (aka has minimal selectable text) use OCR
    else:
        pdf_path = ''
        extracted_text = add_line_numbers(extract_text_from_images_pdf(pdf_path))
    
    txt_path = './txt_folder/Con_Law_w_numbered_lines.txt'
    with open(txt_path, 'w') as f:
        f.write(extracted_text)
        print(f"Combined text saved to {txt_path}")
