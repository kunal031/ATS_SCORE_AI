import express from "express";
import { upload } from "../middleware/upload.js";
import { uploadResume, analyzeResume, analyzeBatch } from "../controllers/resumeController.js";

const router = express.Router();

router.post("/upload", upload.single("resume"), uploadResume);
router.post("/analyze", analyzeResume);
router.post("/analyze-batch", analyzeBatch);

export default router;