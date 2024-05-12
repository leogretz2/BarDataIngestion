import os
import PyPDF2
import docx
from pathlib import Path
import pytesseract
from pdf2image import convert_from_path

from pdfminer.high_level import extract_text


def ocr_pdf(file_path):
    pages = convert_from_path(file_path, 300)
    return "\n".join([pytesseract.image_to_string(page) for page in pages])


def extract_text_from_pdfminer(pdf_path):
    try:
        text = extract_text(pdf_path)
        return text
    except Exception as e:
        return f"Error extracting text: {str(e)}"


def extract_text_from_pdf(file_path):
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = [
            page.extract_text() for page in reader.pages
            if page.extract_text()
        ]
        combined_text = "\n".join(text)
        if combined_text and len(combined_text.split()) >= 50:
            return combined_text
        else:
            print(f"{file_path} needs ocr")
            # If text is not extracted or less than 50 words, perform OCR
            return 'need ocr'  #ocr_pdf(file_path)


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


def process_directory(directory, output_folder):
    os.makedirs(output_folder,
                exist_ok=True)  # Ensure the output folder exists
    if os.listdir(output_folder):
        print(
            f"Output folder '{output_folder}' is not empty. Starting processing."
        )
    for root, dirs, files in os.walk(directory, topdown=True):
        print('it: ', root, dirs, files)
        for name in files:
            txt_file, txt_path = "", ""
            print('processing: ', name)
            file_path = os.path.join(root, name)
            if root != directory:
                print('rooter', root, directory)
                if root == './working_folder/NCBE_Online_MBE_Practice_Exam_1':
                    # subfolder
                    base_name = Path(root).stem
                    txt_path = os.path.join(output_folder, f"{base_name}.txt")
                    for file in root:
                        text = convert_to_text(file_path)
                        if text:
                            txt_file += text + "\n\n"
                else:
                    continue
            else:
                # standalone
                continue
                base_name = Path(name).stem
                txt_path = os.path.join(output_folder, f"{base_name}.txt")
                text = convert_to_text(file_path)

            with open(txt_path, 'w') as f:
                f.write(txt_file)
                print(f"Combined text saved to {txt_path}")

        # os.remove(file_path)  # Uncomment to delete files after processing
        # if combined_text:
        #     # Define path for saving text file based on whether it's a subfolder or root file
        #     if root == directory:
        #         # Files in the root, save with original file name
        #         for name in files:
        #             base_name = Path(name).stem
        #             txt_path = os.path.join(output_folder, f"{base_name}.txt")
        #             with open(txt_path, 'w') as f:
        #                 f.write(combined_text)
        #                 print(f"Text saved to {txt_path}")
        #     else:
        #         # Subfolder, save with subfolder name
        #         folder_name = Path(root).name
        #         txt_path = os.path.join(output_folder, f"{folder_name}.txt")
        #         with open(txt_path, 'w') as f:
        #             f.write(combined_text)
        #             print(f"Combined text saved to {txt_path}")


if __name__ == "__main__":
    working_folder = './working_folder'
    output_folder = './txt_folder'

    t1 = extract_text_from_pdfminer(
        './working_folder/NCBE_Online_MBE_Practice_Exam_1/NCBE_Online_MBE_Practice_Exam_1_Questions.pdf'
    )

    t2 = extract_text_from_pdfminer(
        './working_folder/NCBE_Online_MBE_Practice_Exam_1/NCBE_Online_MBE_Practice_Exam_1_Answers.pdf'
    )

    txt_path = './txt_folder'
    txt_file = t1 + '\n\n' + t2
    with open(txt_path, 'w') as f:
        f.write(txt_file)
        print(f"Combined text saved to {txt_path}")
        # process_directory(working_folder, output_folder)
