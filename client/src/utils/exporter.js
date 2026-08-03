/**
 * Export utilities for downloading evaluation reports as CSV or copying as formatted TSV for Google Sheets.
 * Strictly formatted to contain: user_id, resume_link, resume_score for each candidate row.
 */

function formatEvaluationArray(results = []) {
  if (!Array.isArray(results) || results.length === 0) return [];
  
  return results.map(row => {
    const user_id = String(row.user_id || row.id || "Unknown_Candidate").replace(/["',]/g, "");
    const resume_link = String(row.resume_link || row.resumeUrl || "Missing link").replace(/["']/g, "");
    const resume_score = row.resume_score !== undefined && row.resume_score !== null ? row.resume_score : (row.ats_percentage !== null ? row.ats_percentage : 0);
    return { user_id, resume_link, resume_score };
  });
}

/**
 * Trigger browser download of CSV spreadsheet containing user_id, resume_link, resume_score.
 */
export function exportToCSV(results = [], filename = "Candidate_Evaluation_Report.csv") {
  const data = formatEvaluationArray(results);
  if (data.length === 0) {
    alert("No evaluation output available to export.");
    return;
  }

  const headers = ["user_id", "resume_link", "resume_score"];
  const csvRows = [
    headers.join(","),
    ...data.map(item => `"${item.user_id}","${item.resume_link}",${item.resume_score}`)
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies table rows formatted as TSV (Tab-Separated Values) to clipboard for effortless pasting into Google Sheets or Excel.
 */
export async function copyForGoogleSheets(results = [], onSuccess) {
  const data = formatEvaluationArray(results);
  if (data.length === 0) {
    alert("No evaluation output available to copy.");
    return false;
  }

  const headers = ["user_id\tresume_link\tresume_score"];
  const tsvRows = [
    headers[0],
    ...data.map(item => `${item.user_id}\t${item.resume_link}\t${item.resume_score}`)
  ];

  const textToCopy = tsvRows.join("\n");

  try {
    await navigator.clipboard.writeText(textToCopy);
    if (onSuccess) onSuccess();
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    alert("Could not automatically copy to clipboard. Your browser might block clipboard permissions.");
    return false;
  }
}
