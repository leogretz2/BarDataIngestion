import os

def replace_newlines(filename):
    # Read the content from the file
    with open(f'./txt_folder/{filename}', 'r') as file:
        content = file.read()

    # Replace three or more newline characters with two newline characters
    import re
    modified_content = re.sub(r'\n{3,}', '\n\n', content)

    # Write the modified content back to the file
    with open(f'./txt_folder_modified/{filename}', 'w') as file:
        file.write(modified_content)

def main():
    for filename in os.listdir('./txt_folder'):
        replace_newlines(filename)


main()
