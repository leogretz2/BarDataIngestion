import fs from "fs/promises";

// import pdfjsLib from "pdfjs-dist/build/pdf.mjs";

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';

// import PDFParse from "pdf-parse2";

// async function convertPdfToTxt(pdfPath, txtPath) {
//   try {
//     const dataBuffer = await fs.readFile(pdfPath);
//     const pdfParser = new PDFParse();

//     const pdfData = await pdfParser.loadPDF(dataBuffer);
//     await fs.writeFile(txtPath, pdfData.text);

//     console.log(`Converted PDF to TXT: ${txtPath}`);
//   } catch (error) {
//     console.error("Error converting PDF to TXT:", error);
//   }
// }

// const pdfPath = "./working_folder/Con Law Adaptibar.pdf";
// const txtPath = "./working_folder/Con Law Adaptibar.txt";
// convertPdfToTxt(pdfPath, txtPath);
