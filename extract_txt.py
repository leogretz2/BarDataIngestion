# import PyPDF2
# import sys

# def extract_text_from_pdf(pdf_path):
#     with open(pdf_path, 'rb') as file:
#         reader = PyPDF2.PdfReader(file)
#         num_pages = len(reader.pages)
#         all_text = ""
#         for i in range(num_pages):
#             page = reader.pages[i]
#             all_text += page.extract_text() + "\n"
#     return all_text


# if __name__ == "__main__":
#     if len(sys.argv) > 0:
#         # pdf_path = sys.argv[1]
#         pdf_path = './working_folder/Con Law Adaptibar.pdf'
#         extracted_text = extract_text_from_pdf(pdf_path)
#         print(extracted_text)
#     else:
#         print("Usage: python extract_text.py <path_to_pdf>")


import os
import PyPDF2
import docx
from pathlib import Path
import pytesseract
from pdf2image import convert_from_path

def ocr_pdf(file_path):
    pages = convert_from_path(file_path, 300)
    return "\n".join([pytesseract.image_to_string(page) for page in pages])

def extract_text_from_pdf(file_path):
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = [page.extract_text() for page in reader.pages if page.extract_text()]
        combined_text = "\n".join(text)
        if combined_text and len(combined_text.split()) >= 50:
            return combined_text
        else:
            # If text is not extracted or less than 50 words, perform OCR
            return ocr_pdf(file_path)

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def convert_to_text(file_path):
    text = None
    if file_path.endswith('.pdf'):
        text = extract_text_from_pdf(file_path)
        # Check if it's likely a scanned PDF (less than 50 words)
        if text and len(text.split()) < 50:
            text = None  # Treat as a non-selectable text PDF
    elif file_path.endswith('.docx'):
        text = extract_text_from_docx(file_path)
    return text

def process_directory(directory):
    for root, dirs, files in os.walk(directory, topdown=False):
        combined_text = ""
        for name in files:
            file_path = os.path.join(root, name)
            text = convert_to_text(file_path)
            if text:
                combined_text += text + "\n\n"
                # os.remove(file_path)
        if combined_text:
            # Save combined text to a new .txt file in the same directory
            txt_path = os.path.join(root, f"{Path(root).stem}.txt")
            with open(txt_path, 'w') as f:
                f.write(combined_text)
                print(f"Combined text saved to {txt_path}")
        # Optionally remove the directory if it's not the root directory
        # if root != directory:
        #     os.rmdir(root)

if __name__ == "__main__":
    working_folder = './working_folder'  # Adjust the path as needed
    process_directory(working_folder)
