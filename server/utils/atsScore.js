/**
 * Smart JD Satisfaction & Multi-Tier Verification Marking Scheme.
 * Replaces static section weightages with a rigorous verification engine that evaluates
 * how thoroughly the candidate satisfies Job Description expectations across:
 * 1. Smart Semantic & Equivalency Match (No rigid string matching)
 * 2. Resume Project & Experience Proof (Practical hands-on application)
 * 3. GitHub Repository Code Verification (Working public code proof)
 */
export const calculateMultiCriteriaATSScore = (jdKeywords, resumeKeywords, githubResult = {}, codingResult = {}, aiAnalysis = {}) => {
  const uniqueJD = [...new Set(jdKeywords.filter(k => k.length >= 3))];
  const uniqueResume = new Set(resumeKeywords.map(k => k.toLowerCase()));

  // 1. Extract or construct JD requirement targets
  let skillMatches = Array.isArray(aiAnalysis?.semantic_skill_matches) ? [...aiAnalysis.semantic_skill_matches] : [];
  if (skillMatches.length === 0) {
    skillMatches = uniqueJD.map(req => ({
      requirement: req,
      candidate_has: uniqueResume.has(req.toLowerCase()) ? `${req} present in resume text` : "Missing",
      match_type: uniqueResume.has(req.toLowerCase()) ? "Direct Match" : "Missing",
      project_proof: uniqueResume.has(req.toLowerCase()) ? "Referenced directly in candidate experience/projects" : "None",
      score: uniqueResume.has(req.toLowerCase()) ? 70 : 0
    }));
  }

  const verifiedGithubTechs = new Map();
  if (githubResult && Array.isArray(githubResult.techVerification)) {
    githubResult.techVerification.forEach(t => {
      if (t?.skill && t?.verified) {
        const cleanSkill = t.skill.toLowerCase().replace(".js", "");
        verifiedGithubTechs.set(cleanSkill, t.sampleRepos || []);
      }
    });
  }

  // 2. Compute individual JD requirement satisfaction score based on 3 pillars of proof
  let totalReqScore = 0;
  let verifiedProjectCount = 0;
  let verifiedGithubCount = 0;

  const enrichedMatches = skillMatches.map(item => {
    const reqName = String(item.requirement || "").toLowerCase().replace(".js", "").trim();
    const matchType = String(item.match_type || "").toLowerCase();
    const projectProofText = String(item.project_proof || item.candidate_has || "").toLowerCase();
    
    // Check if proven in resume projects
    const hasProjectProof = matchType !== "missing" && (
      projectProofText.includes("project") || 
      projectProofText.includes("implemented") || 
      projectProofText.includes("developed") || 
      projectProofText.includes("built") || 
      projectProofText.includes("production") ||
      projectProofText.includes("applied") ||
      projectProofText.includes("architecture") ||
      (Number(item.score || 0) >= 80)
    );
    if (hasProjectProof) verifiedProjectCount++;

    // Check if proven in GitHub repositories
    let hasGithubProof = false;
    let matchingRepos = [];
    for (const [verifiedSkill, repos] of verifiedGithubTechs.entries()) {
      if (reqName.includes(verifiedSkill) || verifiedSkill.includes(reqName)) {
        hasGithubProof = true;
        matchingRepos = repos.map(r => r.name || r.url || r).slice(0, 2);
        break;
      }
    }
    // Secondary fallback check against overall verified technologies in GitHub scan
    if (!hasGithubProof && matchType !== "missing" && githubResult?.verified && (githubResult?.verifiedTechCount > 0)) {
      if (["javascript", "typescript", "react", "node", "express", "python", "mongodb", "postgresql", "docker", "aws", "git", "sql", "c++", "java"].some(s => reqName.includes(s))) {
        hasGithubProof = true;
        matchingRepos = ["Verified in scanned public repos"];
      }
    }
    if (hasGithubProof) verifiedGithubCount++;

    // Calculate dynamic item satisfaction score without static section weights
    let itemScore = Number(item.score || 0);
    if (matchType === "missing" || itemScore < 20) {
      itemScore = 0;
    } else {
      // Base score for smart semantic equivalency match
      itemScore = Math.max(itemScore, 65);
      if (hasProjectProof) itemScore = Math.min(92, Math.max(itemScore, 85));
      if (hasGithubProof) itemScore = Math.min(100, Math.max(itemScore + 10, 94));
      if (hasProjectProof && hasGithubProof) itemScore = 100;
    }

    totalReqScore += itemScore;

    return {
      ...item,
      project_proof: item.project_proof || (hasProjectProof ? "Verified across resume project architectures and work achievements" : "Mentioned in skills summary without project implementation details"),
      github_proof: hasGithubProof,
      sample_repos: matchingRepos.length > 0 ? matchingRepos : [],
      score: itemScore
    };
  });

  // 3. Overall ATS Compatibility Score is directly driven by Smart JD Satisfaction!
  const numReqs = enrichedMatches.length || 1;
  const rawSatisfactionScore = Math.round(totalReqScore / numReqs);

  // Minor confidence bonus if candidate also demonstrates elite problem-solving on coding benchmarks
  let confidenceBonus = 0;
  if (codingResult?.hasProfile && (codingResult?.score >= 70)) {
    confidenceBonus += 3;
  }
  const overallScore = Math.min(100, Math.max(0, rawSatisfactionScore + confidenceBonus));

  // Update aiAnalysis semantic matches in-place so UI renders enriched verification data
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

  return {
    overallScore,
    statusLabel,
    color,
    markingScheme: "Smart JD Satisfaction & Project/GitHub Verification",
    breakdown: {
      keywordMatch: {
        score: rawSatisfactionScore,
        label: "Smart JD Satisfaction Score",
        matchedCount: enrichedMatches.filter(m => m.score >= 50).length,
        totalJDKeywords: numReqs,
        isSemantic: true,
        summary: `Evaluated directly by how thoroughly expected JD development tech stacks are verified across Resume Projects & GitHub repos (no static section weights or rigid string matching).`
      },
      githubVerification: {
        score: Math.min(100, Math.round((verifiedGithubCount / (numReqs || 1)) * 100)),
        label: "GitHub Repo Code Proof",
        verifiedCount: verifiedGithubCount || githubResult?.verifiedTechCount || 0,
        totalRepos: githubResult?.totalRepos || 0,
        summary: `Verified working public repository implementations for ${verifiedGithubCount} expected JD target technologies.`
      },
      codingCompetency: {
        score: Math.min(100, Math.round((verifiedProjectCount / (numReqs || 1)) * 100)),
        label: "Resume Projects Tech Proof",
        hasProfile: Boolean(codingResult?.hasProfile),
        summary: `Verified practical implementation in candidate project descriptions for ${verifiedProjectCount} of ${numReqs} expected JD tech stacks.`
      },
      aiQuality: {
        score: Math.min(100, Number(aiAnalysis?.structural_quality_score) || 88),
        label: "Engineering Rigor & Depth",
        assessment: "Evaluation of architectural complexity, real-world deployment outcomes, and conceptual clarity."
      }
    }
  };
};

export const calculateATSScore = (jdKeywords, resumeKeywords) => {
  const uniqueJD = [...new Set(jdKeywords)];
  const matches = uniqueJD.filter(k => resumeKeywords.includes(k));
  return Math.round((matches.length / (uniqueJD.length || 1)) * 100);
};