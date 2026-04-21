import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;
import { analyzeResumeContent } from "../services/resumeService.js";

const safeDeleteFile = (filePath) => {
  if (!filePath) return;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const uploadAndAnalyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No resume file provided." });
    }

    const { path, mimetype } = req.file;

    let extractedText = "";

    // Parse PDF
    if (mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(path);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else {
      // Clean up uploaded file before sending error
      safeDeleteFile(path);
      return res.status(400).json({
        success: false,
        message: "Unsupported file type. Please upload a PDF.",
      });
    }

    // Pass to AI resume analysis service
    console.log(`[Resume Analyzer]: Starting text extraction via AI model...`);
    const analysisResult = await analyzeResumeContent(extractedText);
    
    // Log the entire parsed response explicitly
    console.log(`[Resume Analyzer 🎉]: Successfully extracted data payload!`);
    console.log(JSON.stringify(analysisResult, null, 2));

    // Clean up temporary file
    safeDeleteFile(path);

    res.status(200).json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    console.error("Error processing resume:", error);
    
    // Ensure we attempt to clean up the file on error
    if (req.file && req.file.path) {
      safeDeleteFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to analyze resume. Please try again.",
    });
  }
};
