#pip install pdfminer.six python-docx

import os
from pdfminer.high_level import extract_text
import docx

def add_line_numbers(text):
    lines = text.split('\n')
    max_line_number = len(lines)
    padding = len(str(max_line_number))
    numbered_lines = [(f"(Line_{str(index).zfill(padding)}): {line}" if line else line) for index, line in enumerate(lines, 1)]
    return "\n".join(numbered_lines)

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def process_folder(base_folder):
    for subfolder in os.listdir(base_folder):
        subfolder_path = os.path.join(base_folder, subfolder)
        if os.path.isdir(subfolder_path):
            combined_text = ''
            docx_present = False

            for file_name in os.listdir(subfolder_path):
                if file_name.endswith('.pdf'):
                    print(f"{file_name} is a PDF.")
                    break
                elif file_name.endswith('.docx'):
                    docx_present = True
                    file_path = os.path.join(subfolder_path, file_name)
                    combined_text += extract_text_from_docx(file_path) + '\n\n'

            if docx_present:
                combined_text = add_line_numbers(combined_text)
                output_file_path = os.path.join(subfolder_path, f'{subfolder}_with_line_numbers.txt')
                with open(output_file_path, 'w') as f:
                    f.write(combined_text)
                    print(f"Combined text with line numbers saved to {output_file_path}")

def add_line_numbers(text):
    lines = text.split('\n')
    numbered_lines = [(f"(Line_{index:04}): {line}" if line else line) for index, line in enumerate(lines, 1)]
    return "\n".join(numbered_lines)

def main():
    # Usage
    base_folder = './working_folder'
    process_folder(base_folder)

def main2():
    