import axios from "axios";
import pdf from "pdf-parse";
import mammoth from "mammoth";

const pdfParse = pdf.default || pdf;

const RESUME_SYSTEM_PROMPT = `You are an expert AI technical recruiter and resume parsing specialist. Your task is to analyze raw text extracted from a candidate's resume and extract complete, structured information into valid JSON.

INSTRUCTIONS:
1. Carefully analyze all sections of the resume text (Education, Projects, Skills, Certifications, Work Experience).
2. Extract the information corresponding to the following categories:
   - "candidate_name": Name of the candidate.
   - "email": Email address if present.
   - "profile_links": Array of links (GitHub, LinkedIn, Portfolio, etc.).
   - "tech_stack": A comprehensive, duplicate-free array of all technical skills mentioned in the resume (Programming Languages, Frameworks, Databases, Tools, ML/DL models, Libraries, Cloud platforms, GenAI tools like LangChain, LLaMA, Pinecone, ChromaDB, Streamlit, Flask). Include technologies from both the "Skills" section and individual project tools.
   - "soft_skills": An array of all soft skills and interpersonal competencies mentioned (e.g., Critical Thinking, Problem Solving, Teamwork, Communication, Adaptability, Leadership).
   - "experience_summary": Summary of work experience or academic level (e.g. "M.Tech CSE student with real-world GenAI project implementations").
   - "projects": Array of project titles mentioned.
3. Output ONLY valid JSON without any conversational intro or markdown outside the JSON block.

OUTPUT FORMAT:
{
  "candidate_name": "...",
  "email": "...",
  "profile_links": ["...", "..."],
  "tech_stack": ["...", "..."],
  "soft_skills": ["...", "..."],
  "experience_summary": "...",
  "projects": ["...", "..."]
}`;

/**
 * Automatically converts web preview sharing links (Google Drive, GitHub Blob) 
 * into direct raw file downloading streams.
 */
function convertToDirectDownloadUrl(url) {
  if (!url || typeof url !== "string") return url;
  
  const cleanUrl = url.trim();

  // 1. Google Drive link conversion (e.g. /file/d/FILE_ID/view or open?id=FILE_ID)
  if (cleanUrl.includes("drive.google.com") || cleanUrl.includes("docs.google.com")) {
    const match = cleanUrl.match(/(?:\/file\/d\/|\/open\?id=|\/d\/|id=)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  
  // 2. GitHub viewer URL conversion (blob -> raw)
  if (cleanUrl.includes("github.com") && cleanUrl.includes("/blob/")) {
    return cleanUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
  }

  return cleanUrl;
}

/**
 * Fallback parser to deterministically extract tech_stack and soft_skills even offline or during API rate-limits.
 */
function parseResumeFallback(rawText = "") {
  // Normalize awkward line breaks from PDF OCR/parsing (e.g. "Leadership\nSkill" -> "Leadership Skill")
  const cleanText = rawText.replace(/(\r\n|\n|\r)/g, " ").replace(/\s+/g, " ");
  const lowerText = cleanText.toLowerCase();

  // 1. Extract Candidate Name (Assume first 2-3 capitalized words at top of document)
  let candidate_name = "Candidate Profile";
  const nameMatch = rawText.trim().match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  if (nameMatch) candidate_name = nameMatch[1];

  // 2. Extract Email & Links
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "Not specified";

  const profile_links = [];
  const linkMatches = rawText.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com|linkedin\.com|leetcode\.com|codeforces\.com|hackerrank\.com)\/[A-Za-z0-9_-]+/gi);
  if (linkMatches) {
    linkMatches.forEach(link => {
      if (!profile_links.includes(link)) profile_links.push(link);
    });
  }

  // 3. Extract Tech Stack (Comprehensive industry + AI/ML/Data Science dictionary scanning)
  const techDictionary = [
    "C++", "Python", "Java", "SQL", "JavaScript", "TypeScript", "C#", "Go", "Rust", "PHP",
    "Jupyter Notebook", "Google Colab", "Kaggle", "VS Code", "GitHub", "Git", "Linux", "Docker", "AWS", "Kubernetes",
    "NumPy", "Pandas", "Matplotlib", "Seaborn", "Plotly", "Scikit-Learn", "TensorFlow", "Keras", "PyTorch", "OpenCV",
    "Regression", "Classification", "ANN", "CNN", "RNN", "LSTM", "GRU", "Transformer", "Boltzmann Machine",
    "LangChain", "LLaMA", "HuggingFace", "HuggingFaceBGE", "Pinecone", "ChromaDB", "Mistral", "Ollama", "RAG", "GenAI",
    "Flask", "Streamlit", "React", "React.js", "Node.js", "Express", "MongoDB", "PostgreSQL", "Next.js", "Tailwind CSS"
  ];

  const tech_stack = [];
  techDictionary.forEach(tech => {
    const regex = new RegExp(`\\b${tech.replace(".", "\\.").replace("+", "\\+")}\\b`, "i");
    if (regex.test(cleanText) && !tech_stack.some(t => t.toLowerCase() === tech.toLowerCase())) {
      tech_stack.push(tech);
    }
  });

  // Also parse explicit comma-separated skill lists if user wrote custom items under "Skills"
  const skillsMatch = cleanText.match(/Skills\s*•?\s*Programming Languages:([^•]+)•?\s*Tools:([^•]+)•?\s*Libraries:([^•]+)/i);
  if (skillsMatch) {
    [skillsMatch[1], skillsMatch[2], skillsMatch[3]].forEach(block => {
      if (block) {
        block.split(",").forEach(item => {
          const t = item.trim().replace(/^[•\-\*\s]+/, "");
          if (t && t.length > 1 && !tech_stack.some(existing => existing.toLowerCase() === t.toLowerCase())) {
            tech_stack.push(t);
          }
        });
      }
    });
  }

  // 4. Extract Soft Skills (Specifically target "Soft Skills:" header and extract all items)
  const soft_skills = [];
  const softSkillMatch = cleanText.match(/Soft Skills:\s*([A-Za-z0-9\s,\-\/\&]+?)(?=\s*•|\s*Certification|\s*Education|\s*Projects|$)/i);
  if (softSkillMatch && softSkillMatch[1]) {
    softSkillMatch[1].split(",").forEach(skill => {
      const cleanedSkill = skill.trim().replace(/^[•\-\*\s]+/, "").replace(/\s+/g, " ");
      if (cleanedSkill.length > 2 && !soft_skills.includes(cleanedSkill)) {
        soft_skills.push(cleanedSkill);
      }
    });
  } else {
    // Dictionary fallback for soft skills
    const commonSoft = ["Critical Thinking", "Problem Solving", "Teamwork", "Communication", "Adaptability", "Leadership", "Time Management"];
    commonSoft.forEach(s => {
      if (new RegExp(`\\b${s}\\b`, "i").test(cleanText)) soft_skills.push(s);
    });
  }

  // 5. Extract Project names
  const projects = [];
  const projMatches = rawText.match(/•\s*([A-Za-z\s]+Chatbot|[A-Za-z\s]+Analyzer|[A-Za-z\s]+Application|[A-Za-z\s]+System):\s*\[/g);
  if (projMatches) {
    projMatches.forEach(p => {
      const name = p.replace(/^[•\s]+/, "").replace(/:\s*\[$/, "").trim();
      if (name) projects.push(name);
    });
  }

  return {
    candidate_name,
    email,
    profile_links,
    tech_stack: tech_stack.length > 0 ? tech_stack : ["General Computing"],
    soft_skills: soft_skills.length > 0 ? soft_skills : ["Communication", "Problem Solving"],
    experience_summary: "Academic and Practical Project Engineering Experience",
    projects: projects.length > 0 ? projects : ["Portfolio Projects"],
    source: "deterministic-fallback"
  };
}

/**
 * AI text extraction agent that parses raw resume string into structured tech_stack, soft_skills, and experience JSON.
 */
export async function analyzeResumeStructure(rawText = "") {
  if (!rawText || !rawText.trim()) {
    return { error: "Empty resume text provided." };
  }

  const apiKey = process.env.MISTRAL_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey && process.env.MISTRAL_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: process.env.MISTRAL_MODEL || "open-mistral-7b",
          messages: [
            { role: "system", content: RESUME_SYSTEM_PROMPT },
            { role: "user", content: rawText.substring(0, 12000) } // Provide full text
          ],
          temperature: 0.1
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 20000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        let content = response.data.choices[0].message.content;
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          const parsed = JSON.parse(content.substring(firstBrace, lastBrace + 1));
          return { ...parsed, source: "mistral-ai" };
        }
      }
    } catch (err) {
      console.warn("AI Resume Analyzer API rate-limited or offline, switching to fallback parser:", err.message);
    }
  }

  return parseResumeFallback(rawText);
}

/**
 * Extracts 100% of the raw document text from an in-memory file buffer without any filtering or truncation.
 */
async function extractRawTextFromBuffer(buffer, contentType = "", url = "") {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid memory buffer received.");
  }

  const headerAscii = buffer.toString("ascii", 0, 5);
  const lowerType = contentType.toLowerCase();
  const lowerUrl = url.toLowerCase();

  const isPdf = headerAscii.startsWith("%PDF-") || lowerType.includes("pdf") || lowerUrl.endsWith(".pdf");
  const isDocx = headerAscii.startsWith("PK") || lowerType.includes("word") || lowerType.includes("officedocument") || lowerUrl.endsWith(".docx") || lowerUrl.endsWith(".doc");

  if (isPdf) {
    try {
      const pdfData = await pdfParse(buffer);
      return pdfData.text || "";
    } catch (err) {
      console.warn("PDF parser encountered malformed structure, falling back to buffer decoding:", err.message);
      return buffer.toString("utf-8");
    }
  }

  if (isDocx) {
    try {
      const docxData = await mammoth.extractRawText({ buffer });
      return docxData.value || "";
    } catch (err) {
      console.warn("Word DOCX parser error, falling back to buffer decoding:", err.message);
      return buffer.toString("utf-8");
    }
  }

  return buffer.toString("utf-8");
}

/**
 * Main utility function to fetch a resume link, output ALL raw information, AND return structured parsed fields.
 */
export async function fetchAndExtractRawResume(resumeUrl) {
  if (!resumeUrl || typeof resumeUrl !== "string" || !resumeUrl.trim()) {
    return {
      success: false,
      error: "No resume URL provided.",
      extractedRawText: "",
      structuredData: null
    };
  }

  const originalUrl = resumeUrl.trim();
  const downloadUrl = convertToDirectDownloadUrl(originalUrl);

  try {
    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "unknown";

    // 1. Extract 100% of raw unadulterated text
    const extractedRawText = await extractRawTextFromBuffer(buffer, contentType, originalUrl);

    // 2. Automatically parse structured tech stack and soft skills via AI / Fallback NLP
    const structuredData = await analyzeResumeStructure(extractedRawText);

    return {
      success: true,
      originalUrl,
      resolvedDownloadUrl: downloadUrl,
      contentType: contentType.split(";")[0],
      totalBytes: buffer.length,
      extractedRawText,
      structuredData
    };
  } catch (err) {
    let errorMessage = err.message || "Unknown networking error";
    if (err.response?.status === 404) {
      errorMessage = "File not found (404). Check if the resume link URL is correct.";
    } else if (err.response?.status === 403 || err.response?.status === 401) {
      errorMessage = "Permission denied (403/401). If this is a Google Drive link, make sure 'General Access' is set to 'Anyone with the link'.";
    }

    return {
      success: false,
      originalUrl,
      resolvedDownloadUrl: downloadUrl,
      error: `Failed to fetch resume from URL: ${errorMessage}`,
      extractedRawText: "",
      structuredData: null
    };
  }
}
