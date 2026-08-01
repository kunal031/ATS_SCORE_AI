import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".rtf"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || file.mimetype.includes("pdf") || file.mimetype.includes("word") || file.mimetype.includes("text")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, and DOCX files are allowed."), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max file size
});