import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import axios from "axios";
import path from "path";

/**
 * Parses resume text from a File Buffer or a remote URL link (PDF, DOCX, TXT).
 */
export async function parseResume(fileBuffer, filename = "resume.pdf", remoteUrl = null) {
  try {
    let buffer = fileBuffer;
    let ext = path.extname(filename || "").toLowerCase();

    // If remote URL provided, fetch buffer via axios
    if (remoteUrl && !buffer) {
      console.log("Fetching resume from URL:", remoteUrl);
      const res = await axios.get(remoteUrl, { responseType: "arraybuffer", timeout: 8000 });
      buffer = Buffer.from(res.data);
      if (!ext) ext = path.extname(remoteUrl).toLowerCase() || ".pdf";
    }

    if (!buffer || buffer.length === 0) {
      throw new Error("Received empty resume document buffer");
    }

    // Handle Word documents (DOC/DOCX)
    if (ext === ".doc" || ext === ".docx" || filename.includes(".doc")) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim() || "Empty DOCX document";
    }

    // Handle plain text / RTF
    if (ext === ".txt" || ext === ".rtf") {
      return buffer.toString("utf-8").trim();
    }

    // Default to PDF Parsing
    try {
      // First try pdf-parse for blazing fast text extraction
      const data = await pdfParse(buffer);
      if (data && data.text && data.text.trim().length > 10) {
        return data.text.trim();
      }
    } catch (pdfParseErr) {
      console.warn("pdf-parse fallback triggered:", pdfParseErr.message);
    }

    // Fallback to pdfjs-dist
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let extractedText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      extractedText += strings.join(" ") + "\n";
    }

    return extractedText.trim();
  } catch (error) {
    console.error("Resume Document Parsing Error:", error);
    throw new Error("Failed to extract text from resume: " + error.message);
  }
}