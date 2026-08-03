import dotenv from "dotenv";
import { fetchAndExtractRawResume } from "./utils/resumeFetcher.js";

dotenv.config();

// ============================================================================
// 👉 PASTE ANY RESUME LINK BELOW (Google Drive PDF, Word DOCX, Direct Link):
// ============================================================================
const sampleResumeUrl = "https://drive.google.com/file/d/18Ua5GnR-gkx1BDxj4_-RRWo_zzj9dWYT/view?usp=drive_link"; 

console.log(`🚀 Downloading, extracting RAW text, and parsing structured skills from:\n   ${sampleResumeUrl}\n`);

fetchAndExtractRawResume(sampleResumeUrl)
  .then((output) => {
    if (output.success) {
      console.log("✅ Fetch Successful!");
      console.log(`📂 Content-Type: ${output.contentType}`);
      console.log(`📦 File Size: ${output.totalBytes} bytes\n`);

      console.log("=== 🎯 STRUCTURED PARSED RESUME DATA (Tech Stack & Soft Skills) ===");
      console.log(JSON.stringify(output.structuredData, null, 2));
      console.log("=== END STRUCTURED DATA ===\n");

      console.log("=== 📄 100% RAW EXTRACTED OUSPUT PREVIEW (First 500 characters) ===");
      console.log(output.extractedRawText.slice(0, 500) + "\n... [TRUNCATED] ...");
    } else {
      console.error("❌ Error fetching resume:", output.error);
    }
  })
  .catch((err) => {
    console.error("❌ Unexpected execution error:", err);
  });
