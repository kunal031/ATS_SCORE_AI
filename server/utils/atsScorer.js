import axios from "axios";

/**
 * Extracts numeric year value from experience strings (e.g. "5+ years" -> 5).
 */
function parseYears(expStr = "") {
  if (!expStr || typeof expStr !== "string") return 0;
  if (expStr.toLowerCase().includes("entry-level") || expStr.toLowerCase().includes("fresher")) return 0;
  const match = expStr.match(/(\d+(?:\.\d+)?)/);
  if (match && match[1]) return parseFloat(match[1]);
  return 0;
}

/**
 * Estimates candidate professional experience years from resume text or academic credentials.
 */
function estimateCandidateExperience(candidateData, rawText = "") {
  const summary = candidateData.experience_summary || "";
  const years = parseYears(summary);
  if (years > 0) return years;

  // Search raw text for explicit year patterns like "X years of experience"
  const textMatch = rawText.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:professional|work|industry|software|data)?\s*experience/i);
  if (textMatch && textMatch[1]) return parseFloat(textMatch[1]);

  // Fallback estimation based on academic degree and project portfolio density
  const lower = rawText.toLowerCase();
  if (lower.includes("m.tech") || lower.includes("m.s.") || lower.includes("masters") || lower.includes("ph.d")) {
    return 2; // Treat higher graduate project/research expertise as equivalent to 2 years B.Tech experience
  }
  if (lower.includes("b.tech") || lower.includes("b.e.") || lower.includes("bachelor")) {
    return 1;
  }
  return 1; // Default minimum baseline for evaluated profiles
}

/**
 * Fetches solved coding problem statistics from LeetCode or extracts from resume mentions.
 */
async function getMediumHardProblemCount(profileLinks = [], rawText = "") {
  // 1. Check raw resume text for explicit problem counts (e.g., "Solved 150+ LeetCode Medium/Hard problems")
  const regex = /solved\s*(\d+)\+?\s*(?:leetcode|coding|medium|hard|dsa|problems|questions)/i;
  const match = rawText.match(regex);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  // 2. Try LeetCode API if username is linked in resume
  const leetLink = profileLinks.find(link => link.toLowerCase().includes("leetcode.com"));
  if (leetLink) {
    const usernameMatch = leetLink.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)/i);
    if (usernameMatch && usernameMatch[1]) {
      const username = usernameMatch[1];
      try {
        const query = `
          query userProblemsSolved($username: String!) {
            matchedUser(username: $username) {
              submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `;
        const res = await axios.post(
          "https://leetcode.com/graphql/",
          { query, variables: { username } },
          { timeout: 5000 }
        );
        const stats = res.data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
        if (Array.isArray(stats)) {
          const med = stats.find(s => s.difficulty === "Medium")?.count || 0;
          const hard = stats.find(s => s.difficulty === "Hard")?.count || 0;
          return med + hard;
        }
      } catch (err) {
        console.warn(`Could not fetch LeetCode API stats for ${username}:`, err.message);
      }
    }
  }

  // Default assumption if DSA is mentioned in profile skills
  if (/\b(dsa|data structures|algorithms|leetcode|competitive programming)\b/i.test(rawText)) {
    return 50; // Moderate estimated count if competitive programming is listed as a core competence
  }
  return 0;
}

/**
 * Calculates deterministic scores across all 4 pillars according to exact required marking scheme.
 */
export async function evaluateCandidateScore(analyzedJD, parsedResume, rawText = "") {
  const jd = analyzedJD || {};
  const cand = parsedResume || {};

  // ==========================================
  // 1. EXPERIENCE PILLAR
  // ==========================================
  const reqYears = parseYears(jd.experience);
  const candYears = estimateCandidateExperience(cand, rawText);

  let expScore = 100;
  if (reqYears > 0) {
    if (candYears >= reqYears) {
      expScore = 100;
    } else {
      expScore = Math.min(100, Math.round((candYears / reqYears) * 100));
    }
  }

  // ==========================================
  // 2. TECH STACK PILLAR
  // ==========================================
  const reqTech = Array.isArray(jd.tech_stack) ? jd.tech_stack.filter(t => t !== "Not specified") : [];
  const candTech = Array.isArray(cand.tech_stack) ? cand.tech_stack : [];
  const lowerCandTech = candTech.map(t => t.toLowerCase());
  const lowerRawText = rawText.toLowerCase();

  let matchedTechCount = 0;
  const matchedTechItems = [];

  if (reqTech.length > 0) {
    reqTech.forEach(target => {
      const cleanTarget = target.trim().toLowerCase();
      // Check exact array match or presence in raw resume text
      if (lowerCandTech.some(ct => ct.includes(cleanTarget) || cleanTarget.includes(ct)) || lowerRawText.includes(cleanTarget)) {
        matchedTechCount++;
        matchedTechItems.push(target);
      }
    });

    const rawTechRatio = (matchedTechCount / reqTech.length) * 100;
    var techScore = 100;
    if (rawTechRatio >= 95) {
      techScore = 100;
    } else if (rawTechRatio >= 80 && rawTechRatio < 95) {
      techScore = 90;
    } else {
      techScore = Math.round(rawTechRatio);
    }
  } else {
    techScore = 100;
  }

  // ==========================================
  // 3. CODING / DSA PILLAR (Conditional Weightage)
  // ==========================================
  const dsaReqStr = (jd.dsa_coding_requirements || "").trim();
  const isDsaRequired = !!(dsaReqStr && dsaReqStr !== "Not specified" && dsaReqStr.toLowerCase() !== "none" && !dsaReqStr.toLowerCase().includes("not required"));

  const mediumHardCount = await getMediumHardProblemCount(cand.profile_links || [], rawText);
  let dsaScore = 0;
  if (mediumHardCount >= 100) {
    dsaScore = 100;
  } else if (mediumHardCount >= 75) {
    dsaScore = 75;
  } else {
    dsaScore = Math.round(mediumHardCount);
  }

  // ==========================================
  // 4. SOFT SKILLS PILLAR
  // ==========================================
  const reqSoft = Array.isArray(jd.soft_skills) ? jd.soft_skills.filter(s => s !== "Not specified") : [];
  const candSoft = Array.isArray(cand.soft_skills) ? cand.soft_skills : [];
  const lowerCandSoft = candSoft.map(s => s.toLowerCase());

  let matchedSoftCount = 0;
  const matchedSoftItems = [];

  if (reqSoft.length > 0) {
    reqSoft.forEach(target => {
      const cleanTarget = target.trim().toLowerCase().split(/\s+/)[0]; // e.g. match "communication" from "Excellent communication"
      if (lowerCandSoft.some(cs => cs.includes(cleanTarget)) || lowerRawText.includes(cleanTarget)) {
        matchedSoftCount++;
        matchedSoftItems.push(target);
      }
    });
    var softScore = Math.min(100, Math.round((matchedSoftCount / reqSoft.length) * 100));
  } else {
    softScore = 100;
  }

  // ==========================================
  // 5. OVERALL RESUME SCORE WEIGHTING
  // ==========================================
  let overallScore = 0;
  if (isDsaRequired) {
    // With DSA requirement: Tech Stack (40%), Experience (25%), DSA (20%), Soft Skills (15%)
    overallScore = Math.round((techScore * 0.40) + (expScore * 0.25) + (dsaScore * 0.20) + (softScore * 0.15));
  } else {
    // Without DSA requirement: Tech Stack (55%), Experience (30%), Soft Skills (15%)
    overallScore = Math.round((techScore * 0.55) + (expScore * 0.30) + (softScore * 0.15));
  }

  return {
    overallScore,
    isDsaRequired,
    pillars: {
      experience: {
        score: expScore,
        candidateYears: candYears,
        requiredYears: reqYears
      },
      techStack: {
        score: techScore,
        matchedCount: matchedTechCount,
        requiredCount: reqTech.length,
        matchedItems: matchedTechItems
      },
      codingDsa: {
        score: dsaScore,
        mediumHardCount: mediumHardCount,
        required: isDsaRequired
      },
      softSkills: {
        score: softScore,
        matchedCount: matchedSoftCount,
        requiredCount: reqSoft.length,
        matchedItems: matchedSoftItems
      }
    }
  };
}
