import { getDocument } from "./node_modules/pdfjs-dist/legacy/build/pdf.mjs";

async function loadAndParsePDF(pdfPath) {
  try {
    // Loading a PDF file
    const dataBuffer = await fs.promises.readFile(pdfPath);
    const loadingTask = getDocument(dataBuffer);
    const pdfDoc = await loadingTask.promise;

    // Example: Fetching text from the first page
    const page = await pdfDoc.getPage(1);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(" ");

    console.log("Extracted text:", text);
  } catch (error) {
    console.error("Error handling PDF:", error);
  }
}

loadAndParsePDF("./working_folder/Con Law Adaptibar.pdf");
