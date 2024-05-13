// Import the PDF.js library
import {getDocument} from 'pdfjs-dist/build/pdf';

async function getTextFromPDF(pdfUrl) {
    const loadingTask = getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get the total number of pages in the PDF
    const maxPages = pdf.numPages;
    const pagePromises = [];

    // Collect promises for each page's text content
    for (let j = 1; j <= maxPages; j++) {
        pagePromises.push(
            pdf.getPage(j).then(page => 
                page.getTextContent().then(textContent => 
                    textContent.items.map(item => item.str).join('')
                )
            )
        );
    }

    // Wait for all pages and join the text
    const allText = await Promise.all(pagePromises);
    return allText.join(' ');
}

// Example usage
const pdfUrl = './working_folder/300 MBE Q&As.pdf';
getTextFromPDF(pdfUrl).then(text => {
    console.log('Extracted text:', text);
}).catch(error => {
    console.error('Error extracting text:', error);
});

