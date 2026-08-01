/**
 * Export utilities for downloading evaluation reports as CSV or copying as formatted TSV for Google Sheets.
 * Streamlined to strictly contain: Student Name, ATS Score, Coding Platforms Report, and Present Links.
 */

function extractStudentName(item) {
  return item.candidateName || item.aiFeedback?.candidate_name || item.filename || item.id || "Student Candidate";
}

function extractCodingReport(item) {
  const parts = [];
  const lc = item.codingCompetency?.leetcode;
  const cf = item.codingCompetency?.codeforces;
  const hr = item.codingCompetency?.hackerrank;
  if (lc) parts.push(`LeetCode (@${lc.username}): ${lc.solved?.total || 0} Solved (Rank: ${lc.ranking || 'N/A'})`);
  if (cf) parts.push(`Codeforces (@${cf.handle}): Rating ${cf.rating || 0} (${cf.rank || 'Newbie'})`);
  if (hr) parts.push(`HackerRank (@${hr.username || 'User'}): Active Profile`);
  return parts.length > 0 ? parts.join("; ") : "No Algorithmic Coding Profiles Linked";
}

function extractLinksPresent(item) {
  const links = [];
  const lc = item.codingCompetency?.leetcode;
  const cf = item.codingCompetency?.codeforces;
  const hr = item.codingCompetency?.hackerrank;
  const gh = item.githubVerification;

  if (lc?.profileUrl) links.push(`LeetCode: ${lc.profileUrl}`);
  else if (lc?.username) links.push(`LeetCode: https://leetcode.com/u/${lc.username}`);

  if (cf?.profileUrl) links.push(`Codeforces: ${cf.profileUrl}`);
  else if (cf?.handle) links.push(`Codeforces: https://codeforces.com/profile/${cf.handle}`);

  if (hr?.profileUrl || hr?.url) links.push(`HackerRank: ${hr.profileUrl || hr.url}`);

  if (gh?.profileUrl) links.push(`GitHub Profile: ${gh.profileUrl}`);
  else if (gh?.username) links.push(`GitHub Profile: https://github.com/${gh.username}`);

  if (Array.isArray(item.links) && item.links.length > 0) {
    item.links.forEach(l => {
      const str = String(l);
      if (!links.some(existing => existing.includes(str))) {
        links.push(str);
      }
    });
  }

  return links.length > 0 ? links.join(" | ") : "No Links Present";
}

export const exportToCSV = (report) => {
  if (!report) return;

  if (report.isBatch && Array.isArray(report.results)) {
    const headers = ['Student Name', 'ATS Score', 'Coding Platform Report', 'Links Present'];
    const rows = report.results.map(c => [
      `"${String(extractStudentName(c)).replace(/"/g, '""')}"`,
      `"${c.scoreSummary?.overallScore || 0}% (${c.scoreSummary?.statusLabel || 'N/A'})"`,
      `"${String(extractCodingReport(c)).replace(/"/g, '""')}"`,
      `"${String(extractLinksPresent(c)).replace(/"/g, '""')}"`
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
  const studentName = extractStudentName(report);

  const rows = [
    ["ATS Resume Evaluation Report"],
    ["Date", new Date().toLocaleDateString()],
    [],
    ["Student Name", studentName],
    ["ATS Score", `${score}% (${status})`],
    ["Coding Platform Report", extractCodingReport(report)],
    ["Links Present", extractLinksPresent(report)]
  ];

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
  link.setAttribute("download", `ATS_Evaluation_Report_${new Date().toISOString().slice(0,10)}.csv`);
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
      ["Student Name", "ATS Score", "Coding Platform Report", "Links Present"].join("\t")
    ];
    report.results.forEach(c => {
      tsvLines.push([
        extractStudentName(c),
        `${c.scoreSummary?.overallScore || 0}% (${c.scoreSummary?.statusLabel || 'N/A'})`,
        extractCodingReport(c),
        extractLinksPresent(c)
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
  const studentName = extractStudentName(report);

  const tsvLines = [
    ["ATS Resume Evaluation Report", ""].join("\t"),
    ["Student Name:", studentName].join("\t"),
    ["ATS Score:", `${score}% (${status})`].join("\t"),
    ["Coding Platform Report:", extractCodingReport(report)].join("\t"),
    ["Links Present:", extractLinksPresent(report)].join("\t")
  ];

  const tsvString = tsvLines.join("\n");

  try {
    await navigator.clipboard.writeText(tsvString);
    return true;
  } catch (err) {
    console.error("Failed to copy TSV to clipboard:", err);
    return false;
  }
};
