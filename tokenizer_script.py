from tiktoken import Tokenizer

# Initialize the tokenizer
tokenizer = Tokenizer()

# Your input text
text = "Tokenizing text efficiently with Python's Tiktoken library."

# Tokenize the text
tokens = tokenizer.tokenize(text)

# Print the tokens
print(tokens)


# // Import the Tokenizers library
# import { Tokenizer } from 'tokenizers';

# // // Create a tokenizer instance
# // const tokenizer = new Tokenizer();

# // // Tokenize an input string
# // // const inputText= fs.readFileSync(filePath, "utf8");
# // const inputText = 'Hello, world! This is a sample text.';
# // const tokens = tokenizer.tokenize(inputText);
# // console.log(tokens);
# // // Output: [ 'Hello', ',', 'world', '!', 'This', 'is', 'a', 'sample', 'text', '.' ]
