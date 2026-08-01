import { parseResume } from "../utils/resumeParser.js";
import { extractKeywords } from "../utils/keywordExtractor.js";
import { calculateMultiCriteriaATSScore } from "../utils/atsScore.js";
import { analyzeWithAI } from "../utils/aiAnalyzer.js";
import { extractProfiles } from "../utils/profileExtractor.js";
import { verifyGithubTechStack } from "../utils/githubVerifier.js";
import { verifyCodingPlatforms } from "../utils/codingPlatformVerifier.js";
import Resume from "../models/Resume.js";

export const uploadResume = async (req, res) => {
  try {
    let text = "";
    const resumeUrl = req.body?.resumeUrl || req.query?.resumeUrl;

    if (req.file) {
      // Parse uploaded PDF/DOCX file buffer
      text = await parseResume(req.file.buffer, req.file.originalname);
    } else if (resumeUrl) {
      // Parse remote resume link
      text = await parseResume(null, null, resumeUrl);
    } else {
      return res.status(400).json({ error: "No document file or resume URL provided." });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text could be extracted from the resume." });
    }

    // Automatically detect embedded profiles
    const profiles = extractProfiles(text);
    console.log("Resume parsed successfully. Length:", text.length, "Profiles detected:", profiles);

    res.json({
      success: true,
      preview: text.substring(0, 600),
      text,
      detectedProfiles: profiles
    });
  } catch (err) {
    console.error("Upload Resume Error:", err);
    res.status(500).json({ error: err.message || "Failed to process resume file." });
  }
};

function extractCandidateName(text, filename = "", defaultIndex = 1, githubUser = "") {
  if (filename) {
    const cleanFile = filename.replace(/\.(pdf|docx|txt|doc)$/i, "").replace(/[-_]/g, " ").trim();
    if (cleanFile.length > 2 && !cleanFile.toLowerCase().includes("resume") && !cleanFile.toLowerCase().includes("cv") && !cleanFile.toLowerCase().includes("document")) {
      return cleanFile.replace(/(^|\s)\S/g, l => l.toUpperCase());
    }
  }
  if (!text && githubUser) return `@${githubUser}`;
  if (!text) return `Candidate #${defaultIndex}`;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2 && l.length < 40 && !l.includes("@") && !l.includes("http") && !l.toLowerCase().includes("resume") && !l.toLowerCase().includes("curriculum") && !/^[0-9+() -]+$/.test(l));
  if (lines.length > 0) {
    const parsedLine = lines[0].replace(/[0-9]/g, "").trim();
    if (parsedLine.length >= 3 && parsedLine.split(" ").length <= 4) {
      return parsedLine;
    }
  }
  if (githubUser) return `@${githubUser}`;
  return `Candidate #${defaultIndex}`;
}

async function performFullEvaluation(targetText, jobDescription, customProfiles = {}, filename = "", resumeId = "RES-001", index = 1) {
  // 1. Keyword Extraction & Profiles Discovery
  const jdKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(targetText);
  const detectedProfiles = extractProfiles(targetText, customProfiles);

  // 2. Run AI Structural Analysis
  const aiResponse = await analyzeWithAI(targetText, jobDescription);
  const aiAnalysis = aiResponse.analysis || aiResponse;

  // Determine candidate name
  const candidateName = aiAnalysis?.candidate_name || extractCandidateName(targetText, filename, index, detectedProfiles?.github);

  // Determine concrete verifiable required tech stack from AI result
  const requiredTechStack = (aiAnalysis?.verifiable_tech_stack_for_github && aiAnalysis.verifiable_tech_stack_for_github.length > 0)
    ? aiAnalysis.verifiable_tech_stack_for_github
    : ((aiAnalysis?.job_description_skills && aiAnalysis.job_description_skills.length > 0) ? aiAnalysis.job_description_skills : ["JavaScript", "TypeScript", "React.js", "Node.js", "Express", "MongoDB", "Docker", "Git"]);

  // 3. Perform Concurrent External Verifications (GitHub Repos & Coding Platforms)
  const [githubResult, codingResult] = await Promise.all([
    verifyGithubTechStack(detectedProfiles.github, requiredTechStack),
    verifyCodingPlatforms(detectedProfiles)
  ]);

  // 4. Compute Weighted 100-Point Rubric Score utilizing smart AI semantic similarity
  const scoreSummary = calculateMultiCriteriaATSScore(
    jdKeywords, 
    resumeKeywords, 
    githubResult, 
    codingResult, 
    aiAnalysis
  );

  // 5. Construct Integrated Assessment Output
  const fullReport = {
    success: true,
    resumeId,
    candidateName,
    filename: filename || `Resume_${index}.pdf`,
    timestamp: new Date().toISOString(),
    scoreSummary,
    profiles: detectedProfiles,
    githubVerification: githubResult,
    codingCompetency: codingResult,
    aiFeedback: aiAnalysis
  };

  // Optionally persist to DB if online
  try {
    if (process.env.MONGODB_URI && mongoose?.connection?.readyState === 1) {
      await Resume.create({
        text: targetText.substring(0, 1000),
        atsScore: scoreSummary.overallScore,
        suggestions: [fullReport]
      });
    }
  } catch (dbErr) {
    // Ignore DB write errors in offline mode
  }

  return fullReport;
}

export const analyzeResume = async (req, res) => {
  try {
    const { resumeText, jobDescription, resumeUrl, customProfiles = {}, filename = "", id = "RES-001" } = req.body;

    let targetText = resumeText;
    if (!targetText && resumeUrl) {
      targetText = await parseResume(null, null, resumeUrl);
    }

    if (!targetText || !jobDescription) {
      return res.status(400).json({ error: "Missing resume content or job description." });
    }

    console.log(`Starting evaluation for candidate: ${filename || id}...`);
    const report = await performFullEvaluation(targetText, jobDescription, customProfiles, filename, id, 1);
    res.json(report);
  } catch (err) {
    console.error("Analyze Resume Fatal Error:", err);
    res.status(500).json({ error: err.message || "Resume analysis failed during evaluation." });
  }
};

export const analyzeBatch = async (req, res) => {
  try {
    const { jobDescription, resumes = [] } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required for batch analysis." });
    }
    if (!Array.isArray(resumes) || resumes.length === 0) {
      return res.status(400).json({ error: "No resumes provided for batch evaluation." });
    }

    console.log(`Starting batch multi-criteria evaluation for ${resumes.length} candidates...`);
    
    const evalPromises = resumes.map(async (item, idx) => {
      let targetText = item.resumeText || item.text || "";
      if (!targetText && item.resumeUrl) {
        try { targetText = await parseResume(null, null, item.resumeUrl); } catch (e) { console.warn("Link parse error in batch:", e.message); }
      }
      if (!targetText) targetText = `Candidate ${idx + 1} Profile Description`;

      const id = item.id || `RES-00${idx + 1}`;
      const filename = item.filename || `candidate_${idx + 1}.pdf`;
      const customProfiles = item.customProfiles || {};

      return await performFullEvaluation(targetText, jobDescription, customProfiles, filename, id, idx + 1);
    });

    const results = await Promise.all(evalPromises);
    
    // Sort descending by ATS score for optimal recruiter UX
    results.sort((a, b) => (b?.scoreSummary?.overallScore || 0) - (a?.scoreSummary?.overallScore || 0));

    res.json({
      success: true,
      isBatch: true,
      timestamp: new Date().toISOString(),
      jobDescriptionSummary: jobDescription.substring(0, 150) + "...",
      totalEvaluated: results.length,
      results
    });
  } catch (err) {
    console.error("Analyze Batch Fatal Error:", err);
    res.status(500).json({ error: err.message || "Batch evaluation failed." });
  }
};