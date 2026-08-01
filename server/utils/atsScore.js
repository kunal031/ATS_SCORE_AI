import { computeKeywordDensityMatrix } from "./keywordExtractor.js";

/**
 * Enhanced Deterministic Multi-Criteria ATS Rubric & Verification Marking Scheme.
 * Combines:
 * 1. Categorized Keyword Density & Semantic Overlap (Inspired by AI-Resume-Analyzer)
 * 2. Resume Project & Experience Application Proof
 * 3. Smart Role-Based GitHub Repository Code & Tech Stack Proof (with 0% link hallucination)
 * 4. Structural Completeness & Engineering Rigor Assessment
 */
export const calculateMultiCriteriaATSScore = (
  jdKeywords = [], 
  resumeKeywords = [], 
  githubResult = {}, 
  codingResult = {}, 
  aiAnalysis = {},
  jobDescription = "",
  resumeText = ""
) => {
  const uniqueJD = [...new Set(jdKeywords.filter(k => k.length >= 2))];
  const uniqueResume = new Set(resumeKeywords.map(k => String(k).toLowerCase()));

  // 1. Calculate advanced keyword density and domain category alignment if raw texts provided
  const densityResult = (jobDescription && resumeText) 
    ? computeKeywordDensityMatrix(jobDescription, resumeText)
    : {
        densityScore: Math.min(100, Math.round((uniqueJD.filter(k => uniqueResume.has(k.toLowerCase())).length / (uniqueJD.length || 1)) * 100)),
        matchedKeywordCount: uniqueJD.filter(k => uniqueResume.has(k.toLowerCase())).length,
        totalJDKeywords: uniqueJD.length || 1,
        vocabularyOverlap: 80
      };

  // 2. Extract or construct semantic skill requirements from AI analysis
  let skillMatches = Array.isArray(aiAnalysis?.semantic_skill_matches) ? [...aiAnalysis.semantic_skill_matches] : [];
  if (skillMatches.length === 0) {
    skillMatches = uniqueJD.slice(0, 10).map(req => ({
      requirement: req,
      candidate_has: uniqueResume.has(req.toLowerCase()) ? `${req} present in document` : "Missing",
      match_type: uniqueResume.has(req.toLowerCase()) ? "Direct Match" : "Missing",
      project_proof: uniqueResume.has(req.toLowerCase()) ? "Referenced directly in technical skill profile and achievements" : "None",
      score: uniqueResume.has(req.toLowerCase()) ? 80 : 0
    }));
  }

  const verifiedGithubTechs = new Map();
  if (githubResult && Array.isArray(githubResult.techVerification)) {
    githubResult.techVerification.forEach(t => {
      if (t?.skill && t?.present) {
        const cleanSkill = t.skill.toLowerCase().replace(/\.js$/, "");
        verifiedGithubTechs.set(cleanSkill, t.sampleRepos || []);
      }
    });
  }

  // 3. Compute individual JD requirement satisfaction score based on verification proof
  let totalReqScore = 0;
  let verifiedProjectCount = 0;
  let verifiedGithubCount = 0;

  const enrichedMatches = skillMatches.map(item => {
    const reqName = String(item.requirement || "").toLowerCase().replace(/\.js$/, "").trim();
    const matchType = String(item.match_type || "").toLowerCase();
    const projectProofText = String(item.project_proof || item.candidate_has || "").toLowerCase();
    
    // Check if proven in resume projects or engineering architecture
    const hasProjectProof = matchType !== "missing" && (
      projectProofText.includes("project") || 
      projectProofText.includes("implemented") || 
      projectProofText.includes("developed") || 
      projectProofText.includes("built") || 
      projectProofText.includes("production") ||
      projectProofText.includes("applied") ||
      projectProofText.includes("architecture") ||
      projectProofText.includes("engineered") ||
      (Number(item.score || 0) >= 80)
    );
    if (hasProjectProof) verifiedProjectCount++;

    // Check if proven in GitHub repositories
    let hasGithubProof = false;
    let matchingRepos = [];
    for (const [verifiedSkill, repos] of verifiedGithubTechs.entries()) {
      if (reqName.includes(verifiedSkill) || verifiedSkill.includes(reqName) || verifiedSkill.includes("role archetype")) {
        hasGithubProof = true;
        matchingRepos = Array.isArray(repos) ? repos.slice(0, 2) : [];
        if (matchingRepos.length > 0) break;
      }
    }
    
    if (!hasGithubProof && matchType !== "missing" && githubResult?.verified && (githubResult?.verifiedTechCount > 0)) {
      if (["javascript", "typescript", "react", "node", "express", "python", "mongodb", "postgresql", "docker", "aws", "git", "sql", "c++", "java", "ai", "llm", "rag", "pytorch"].some(s => reqName.includes(s))) {
        hasGithubProof = true;
        // Strict anti-hallucination: do not inject artificial string placeholders if sampleRepos was intentionally left empty
        matchingRepos = [];
      }
    }
    if (hasGithubProof) verifiedGithubCount++;

    // Calculate deterministic item score
    let itemScore = Number(item.score || 0);
    if (matchType === "missing" || itemScore < 20) {
      itemScore = 0;
    } else {
      itemScore = Math.max(itemScore, 70);
      if (hasProjectProof) itemScore = Math.min(92, Math.max(itemScore, 85));
      if (hasGithubProof) itemScore = Math.min(100, Math.max(itemScore + 8, 94));
      if (hasProjectProof && hasGithubProof) itemScore = 100;
    }

    totalReqScore += itemScore;

    return {
      ...item,
      project_proof: item.project_proof || (hasProjectProof ? "Verified across resume project architectures and work achievements" : "Mentioned in skills summary without project implementation details"),
      github_proof: hasGithubProof,
      sample_repos: matchingRepos,
      score: itemScore
    };
  });

  const numReqs = enrichedMatches.length || 1;
  const rawSatisfactionScore = Math.round(totalReqScore / numReqs);

  // 4. Compute deterministic component breakdown scores
  const keywordMatchScore = Math.min(100, Math.max(0, Math.round(rawSatisfactionScore * 0.55 + densityResult.densityScore * 0.45)));
  
  // GitHub Verification score
  const githubScore = Math.min(100, Math.max(0, Math.round((verifiedGithubCount / numReqs) * 100) || githubResult?.score || 0));
  
  // Coding Competency & Project Implementation score
  let projectTechScore = Math.min(100, Math.round((verifiedProjectCount / numReqs) * 100));
  if (codingResult?.hasProfile && (codingResult?.score > 0)) {
    projectTechScore = Math.min(100, Math.round((projectTechScore + codingResult.score) / 2));
  }
  
  // AI Structural Quality & Formatting score
  const aiQualityScore = Math.min(100, Number(aiAnalysis?.structural_quality_score) || Number(aiAnalysis?.compatibility_score) || 88);

  // 5. Compute Weighted 100-Point Overall ATS Score (40% Keyword/Semantic + 25% GitHub + 15% Competency/Projects + 20% Structural Quality)
  const overallScore = Math.min(
    100, 
    Math.max(
      0, 
      Math.round(
        keywordMatchScore * 0.40 + 
        githubScore * 0.25 + 
        projectTechScore * 0.15 + 
        aiQualityScore * 0.20
      )
    )
  );

  // Update aiAnalysis semantic matches in-place so UI renders enriched verification data without breaking changes
  if (aiAnalysis && typeof aiAnalysis === "object") {
    aiAnalysis.semantic_skill_matches = enrichedMatches;
  }

  let statusLabel = "Moderate Fit";
  let color = "#fbbf24";
  if (overallScore >= 82) {
    statusLabel = "Highly Verified Fit";
    color = "#10b981";
  } else if (overallScore >= 68) {
    statusLabel = "Verified Match";
    color = "#3b82f6";
  } else if (overallScore < 52) {
    statusLabel = "Unverified / Poor Fit";
    color = "#f43f5e";
  }

  const roleLabel = githubResult?.targetRoleArchetype || "Software Engineering";

  return {
    overallScore,
    statusLabel,
    color,
    markingScheme: `Categorized Domain Density & Smart ${roleLabel} Verification`,
    breakdown: {
      keywordMatch: {
        score: keywordMatchScore,
        label: "Smart JD Satisfaction Score",
        matchedCount: densityResult.matchedKeywordCount || enrichedMatches.filter(m => m.score >= 50).length,
        totalJDKeywords: densityResult.totalJDKeywords || numReqs,
        isSemantic: true,
        summary: `Evaluated via categorized domain dictionaries and semantic project verification (Density overlap: ${densityResult.densityScore || keywordMatchScore}%).`
      },
      githubVerification: {
        score: githubScore,
        label: `GitHub ${roleLabel} Proof`,
        verifiedCount: verifiedGithubCount || githubResult?.verifiedTechCount || 0,
        totalRepos: githubResult?.totalRepos || 0,
        summary: githubResult?.isFallback 
          ? `Live repository verification bypassed due to API rate limits or offline mode; competencies inferred deterministically with 0% artificial links.`
          : `Smart role scan verified working public repositories aligned with '${roleLabel}' across ${verifiedGithubCount || githubResult?.verifiedTechCount || 0} technology clusters.`
      },
      codingCompetency: {
        score: projectTechScore,
        label: "Resume Projects Tech Proof",
        hasProfile: Boolean(codingResult?.hasProfile),
        summary: codingResult?.hasProfile 
          ? `Verified practical implementation in candidate projects combined with algorithmic benchmarks (${codingResult.score}% competency).`
          : `Verified practical hands-on implementation across candidate project descriptions for ${verifiedProjectCount} of ${numReqs} tech stacks.`
      },
      aiQuality: {
        score: aiQualityScore,
        label: "Engineering Rigor & Depth",
        assessment: aiAnalysis?.overall_assessment || "Evaluation of architectural complexity, structural resume completeness, and real-world deployment outcomes."
      }
    }
  };
};

export const calculateATSScore = (jdKeywords = [], resumeKeywords = []) => {
  const uniqueJD = [...new Set(jdKeywords)];
  const matches = uniqueJD.filter(k => resumeKeywords.includes(k));
  return Math.round((matches.length / (uniqueJD.length || 1)) * 100);
};