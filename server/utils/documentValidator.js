/**
 * Zero-Tolerance ATS Document Validation Gate (Stage 1)
 * Verifies if the payload is a genuine professional resume/CV.
 * Instantly fails cover letters, essays, invoices, or non-resume text.
 */

export function validateDocumentGate(text, filename = "") {
  if (!text || typeof text !== "string") {
    return { is_resume: false, reason: "Empty or unreadable document payload." };
  }

  const cleanText = text.trim();
  const wordCount = cleanText.split(/\s+/).length;
  if (wordCount < 30) {
    return { is_resume: false, reason: "Payload content is too brief (< 30 words) to represent a structured professional resume/CV." };
  }

  // ====================================================================
  // 1. INSTANT FAIL EXCLUSIONS (Zero-Tolerance Rejection)
  // ====================================================================

  // A. Invoice / Commercial Bill / Receipt
  if (/\b(invoice\s*(#|no|number|date|to)?|bill\s+to|remit\s+to|subtotal|tax\s+total|amount\s+due|balance\s+due|payment\s+terms|unit\s+price|purchase\s+order|tax\s+invoice)\b/i.test(cleanText)) {
    const invoiceHits = (cleanText.match(/\b(invoice|subtotal|amount\s+due|tax|bill\s+to|qty|unit\s+price|balance\s+due)\b/gi) || []).length;
    if (invoiceHits >= 2 || /^[\s\S]{0,150}\binvoice\b/i.test(cleanText)) {
      return { is_resume: false, reason: "Payload instantly rejected: Detected commercial invoice or billing document." };
    }
  }

  // B. Cover Letter / Application Letter (without attached resume structure)
  const hasSalutation = /\b(dear\s+(hiring\s+manager|recruiter|recruiting|team|sir|madam|mr|ms|mrs)|to\s+whom\s+it\s+may\s+concern|respected\s+(sir|madam))\b/i.test(cleanText);
  const hasLetterSignOff = /\b(sincerely(\s+yours)?|yours\s+faithfully|yours\s+sincerely|thank\s+you\s+for\s+your\s+(time|consideration)|i\s+am\s+writing\s+to\s+(apply|express)|please\s+find\s+my\s+resume\s+attached)\b/i.test(cleanText);
  if (hasSalutation && hasLetterSignOff) {
    return { is_resume: false, reason: "Payload instantly rejected: Detected cover letter or application correspondence without standard resume table structure." };
  }

  // C. Essay / Academic Thesis / Book Chapter / Non-Resume Literature
  if (/\b(chapter\s+\d+|abstract:|thesis\s+statement|in\s+conclusion,|works\s+cited|bibliography|literature\s+review|research\s+methodology)\b/i.test(cleanText)) {
    return { is_resume: false, reason: "Payload instantly rejected: Detected essay, academic article, or literary manuscript rather than a candidate resume." };
  }

  // ====================================================================
  // 2. MANDATORY STRUCTURAL VERIFICATION (Contact, Timeline, Headers)
  // ====================================================================

  // Requirement 1: Contact Placeholders (email or phone markers or developer links)
  const hasEmailOrLink = /\S+@\S+\.\S+|linkedin\.com|github\.com|email:|mailto:/i.test(cleanText);
  const hasPhone = /(?:phone|tel|mob|mobile|call)|(?:\+?\d{1,3}[\s-]?\(?\d{2,3}\)?[\s-]?\d{3,4}[\s-]?\d{4})|(?:\b\d{10}\b)|(?:\d{3}[-.\s]\d{3}[-.\s]\d{4})/i.test(cleanText);
  const hasContact = hasEmailOrLink || hasPhone;

  // Requirement 2: Timeline Indicators (dates/years or chronology expressions)
  const hasTimeline = /\b(19[7-9]\d|20[0-3]\d)\b/i.test(cleanText) || /\b(present|current|till date|to date|ongoing|january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec|years?|yrs?)\b/i.test(cleanText);

  // Requirement 3: Experience / Education / Competence Headers
  const structuralHeaders = [
    /\b(work\s+)?experience\b/i,
    /\beducation\b/i,
    /\b(technical\s+)?skills\b/i,
    /\bprojects?\b/i,
    /\bemployment\b/i,
    /\bqualifications?\b/i,
    /\bwork\s+history\b/i,
    /\bacademics?\b/i,
    /\bcompetencies\b/i,
    /\bsummary\b/i,
    /\bprofile\b/i,
    /\btechnologies\b/i
  ];
  let matchedHeaders = 0;
  for (const rx of structuralHeaders) {
    if (rx.test(cleanText)) matchedHeaders++;
  }
  const hasHeaders = matchedHeaders >= 2;

  // Compile missing mandatory pillars
  const missing = [];
  if (!hasContact) missing.push("Contact placeholders (email/phone markers)");
  if (!hasTimeline) missing.push("Timeline indicators (dates/years)");
  if (!hasHeaders) missing.push("Experience/education structural headers");

  if (missing.length > 0) {
    return {
      is_resume: false,
      reason: `Missing mandatory ATS structural fields: ${missing.join('; ')}.`
    };
  }

  return { is_resume: true, reason: "Verified as a genuine professional resume/CV." };
}
