/**
 * Export utilities for downloading evaluations as CSV or formatted TSV for Google Sheets.
 */

export const exportToCSV = (report) => {
  if (!report) return;

  if (report.isBatch && Array.isArray(report.results)) {
    const headers = ['Resume ID', 'Candidate Name', 'ATS Score', 'GitHub Verified', 'Coding Platforms', 'Executive Takeaway'];
    const rows = report.results.map(c => [
      `"${c.resumeId || c.id || '-'}"`,
      `"${(c.candidateName || 'Candidate').replace(/"/g, '""')}"`,
      `"${c.scoreSummary?.overallScore || 0}%"`,
      `"${c.githubVerification?.username ? '@' + c.githubVerification.username : 'None'}"`,
      `"${c.codingCompetency?.leetcode ? '@' + c.codingCompetency.leetcode.username : 'None'}"`,
      `"${(c.aiFeedback?.overall_assessment || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Batch_ATS_Evaluation_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const score = report.scoreSummary?.overallScore || 0;
  const status = report.scoreSummary?.statusLabel || "N/A";
  const breakdown = report.scoreSummary?.breakdown || {};

  const rows = [];
  rows.push(["ATS Resume AI Evaluation & Verification Report"]);
  rows.push(["Date", new Date().toLocaleDateString()]);
  rows.push(["Overall ATS Compatibility Score", `${score}%`, status]);
  rows.push([]);
  
  rows.push(["--- SCORE BREAKDOWN BY CRITERION ---"]);
  rows.push(["Criterion Name", "Score", "Weight", "Notes"]);
  if (breakdown.keywordMatch) {
    rows.push(["JD & Resume Text Similarity", `${breakdown.keywordMatch.score}%`, "40%", `${breakdown.keywordMatch.matchedCount} keywords matched out of ${breakdown.keywordMatch.totalJDKeywords}`]);
  }
  if (breakdown.githubVerification) {
    rows.push(["GitHub Repositories Tech Proof", `${breakdown.githubVerification.score}%`, "25%", `Verified in ${breakdown.githubVerification.verifiedCount} technologies across ${breakdown.githubVerification.totalRepos} repos`]);
  }
  if (breakdown.codingCompetency) {
    rows.push(["Coding Platforms Competency", `${breakdown.codingCompetency.score}%`, "15%", breakdown.codingCompetency.summary || "Algorithm evaluations"]);
  }
  if (breakdown.aiQuality) {
    rows.push(["AI Structural & Impact Review", `${breakdown.aiQuality.score}%`, "20%", "Action verbs & formatting check"]);
  }
  rows.push([]);

  rows.push(["--- GITHUB TECH STACK VERIFICATION DETAILS ---"]);
  rows.push(["Technology Skill", "Verified Status", "Repository Count", "Sample Repositories"]);
  const techList = report.githubVerification?.techVerification || [];
  techList.forEach(item => {
    const samples = item.sampleRepos?.map(r => `${r.name} (${r.url})`).join("; ") || "None";
    rows.push([item.skill, item.present ? "VERIFIED IN REPOS" : "NOT FOUND", item.repoCount || 0, samples]);
  });
  rows.push([]);

  rows.push(["--- CODING PLATFORMS SUMMARY ---"]);
  if (report.codingCompetency?.leetcode) {
    const lc = report.codingCompetency.leetcode;
    rows.push(["LeetCode Username", lc.username]);
    rows.push(["Total Solved Problems", lc.solved?.total || 0, `Easy: ${lc.solved?.easy || 0}, Medium: ${lc.solved?.medium || 0}, Hard: ${lc.solved?.hard || 0}`]);
    rows.push(["Global Ranking", lc.ranking || "N/A"]);
  }
  if (report.codingCompetency?.codeforces) {
    const cf = report.codingCompetency.codeforces;
    rows.push(["Codeforces Handle", cf.handle]);
    rows.push(["Rating / Rank", `${cf.rating || 0} (${cf.rank || "Newbie"})`]);
  }
  rows.push([]);


  // Convert array of arrays to valid CSV string
  const csvContent = rows.map(row => 
    row.map(cell => {
      if (cell === undefined || cell === null) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  ).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ATS_Verification_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copies formatted TSV data to clipboard for seamless pasting into Google Sheets
 */
export const copyForGoogleSheets = async (report) => {
  if (!report) return false;

  if (report.isBatch && Array.isArray(report.results)) {
    const tsvLines = [
      ["Resume ID", "Candidate Name", "ATS Score", "GitHub Verified", "Coding Platforms", "Executive Takeaway"].join("\t")
    ];
    report.results.forEach(c => {
      tsvLines.push([
        c.resumeId || c.id || '-',
        c.candidateName || 'Candidate',
        `${c.scoreSummary?.overallScore || 0}%`,
        c.githubVerification?.username ? `@${c.githubVerification.username}` : 'None',
        c.codingCompetency?.leetcode ? `@${c.codingCompetency.leetcode.username}` : 'None',
        (c.aiFeedback?.overall_assessment || '').replace(/\s+/g, ' ')
      ].join("\t"));
    });
    try {
      await navigator.clipboard.writeText(tsvLines.join("\n"));
      return true;
    } catch (err) {
      return false;
    }
  }

  const score = report.scoreSummary?.overallScore || 0;
  const status = report.scoreSummary?.statusLabel || "N/A";
  const breakdown = report.scoreSummary?.breakdown || {};
  const techList = report.githubVerification?.techVerification || [];

  const tsvLines = [
    ["ATS Resume AI Evaluation & Verification Report", "", ""].join("\t"),
    ["Overall Compatibility Score:", `${score}%`, status].join("\t"),
    ["", "", ""].join("\t"),
    ["Evaluation Criterion", "Score", "Weight", "Key Insights"].join("\t"),
    ["JD & Resume Text Match", `${breakdown.keywordMatch?.score || 0}%`, "40%", `${breakdown.keywordMatch?.matchedCount || 0} matching target keywords`].join("\t"),
    ["GitHub Tech Stack Proof", `${breakdown.githubVerification?.score || 0}%`, "25%", `Verified repos for required skills`].join("\t"),
    ["Coding Platforms Score", `${breakdown.codingCompetency?.score || 0}%`, "15%", breakdown.codingCompetency?.summary || "Algorithmic competency"].join("\t"),
    ["AI Structural Review", `${breakdown.aiQuality?.score || 0}%`, "20%", "Formatting, action verbs & impact quantification"].join("\t"),
    ["", "", ""].join("\t"),
    ["GitHub Verified Technologies", "Status", "Matching Repos Count"].join("\t")
  ];

  techList.forEach(t => {
    tsvLines.push([t.skill, t.present ? "VERIFIED IN REPOSITORIES" : "NOT FOUND", t.repoCount || 0].join("\t"));
  });

  const tsvString = tsvLines.join("\n");

  try {
    await navigator.clipboard.writeText(tsvString);
    return true;
  } catch (err) {
    console.error("Failed to copy TSV to clipboard:", err);
    return false;
  }
};
