import dotenv from "dotenv";
import { analyzeResume, analyzeBatch } from "./controllers/resumeController.js";

dotenv.config();

// ============================================================================
// 👉 SAMPLE TEST INPUT (JD, user_id, resume_link):
// ============================================================================
const sampleJD = `
We are seeking an AI Engineer / Data Science Developer with at least 2 years of professional engineering or graduate project experience.
Required Tech Stack: Python, LangChain, Pinecone, HuggingFace, Mistral, and Flask.
Candidates must be competent in Data Structures and Algorithms (DSA problem solving tests will be conducted).
Required Soft Skills: Critical Thinking, Problem Solving, and Teamwork.
`;

const candidateId = "Kunal-Raj-001";
const resumeLink = "https://drive.google.com/file/d/18Ua5GnR-gkx1BDxj4_-RRWo_zzj9dWYT/view?usp=drive_link";

console.log("====================================================================");
console.log("🚀 TESTING EVALUATION PIPELINE & MARKING SCHEME");
console.log("====================================================================\n");

const req = {
  body: {
    jd: sampleJD,
    user_id: candidateId,
    resume_link: resumeLink
  }
};

const res = {
  status: (code) => {
    return {
      json: (data) => {
        console.log(`✅ Controller Response (Status ${code}):\n`);
        
        console.log("=== 🏆 OUTPUT TABLE ROW ===");
        console.log(JSON.stringify(data.table_row, null, 2));
        console.log("=============================\n");

        console.log("=== 📊 4-PILLAR MARKING BREAKDOWN ===");
        console.log(JSON.stringify(data.scoreSummary, null, 2));
        console.log("=====================================\n");

        console.log("=== 📌 GLOBALLY ANALYZED JOB DESCRIPTION ===");
        console.log(JSON.stringify(data.analyzed_jd, null, 2));
        return data;
      }
    };
  }
};

analyzeResume(req, res).catch((err) => {
  console.error("❌ Test failed:", err);
});
