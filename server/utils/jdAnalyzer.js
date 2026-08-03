import axios from "axios";

const JD_SYSTEM_PROMPT = `You are an expert technical recruiter and AI text extraction assistant. Your task is to analyze a raw job description provided by the user and extract specific, structured information into a clean JSON format.

INSTRUCTIONS:
1. Read the provided job description carefully.
2. Extract the information corresponding to the following categories:
   - "job_title": The official title of the role (e.g., "Senior Backend Engineer", "Data Scientist").
   - "tech_stack": A list of programming languages, frameworks, databases, and tools required or preferred.
   - "experience": The required years of experience or seniority level (e.g., "3+ years", "Entry-level").
   - "dsa_coding_requirements": Any specific mention of Data Structures, Algorithms, LeetCode-style problem-solving, or specific coding assessments required for the role.
   - "soft_skills": Non-technical skills required (e.g., "communication", "leadership", "agile mindset").
3. If a category is not mentioned in the job description, output "Not specified" for that field.
4. Output ONLY valid JSON. Do not include introductory text, conversational filler, or markdown formatting outside of the JSON block.

OUTPUT FORMAT:
{
  "job_title": "...",
  "tech_stack": ["...", "..."],
  "experience": "...",
  "dsa_coding_requirements": "...",
  "soft_skills": ["...", "..."]
}

EXAMPLE INPUT:
We are looking for a Senior Python Developer to join our team in London. You should have at least 5 years of experience building scalable backend systems. You'll need deep knowledge of Python, Django, and PostgreSQL. We expect candidates to have a strong grasp of data structures and algorithms, as you will be tested on system design and complex algorithmic problem solving during the interview. Excellent communication skills and the ability to mentor junior developers are a must.

EXAMPLE OUTPUT:
{
  "job_title": "Senior Python Developer",
  "tech_stack": ["Python", "Django", "PostgreSQL"],
  "experience": "5+ years",
  "dsa_coding_requirements": "Strong grasp of data structures and algorithms, system design, and algorithmic problem-solving tests.",
  "soft_skills": ["Excellent communication", "Mentoring"]
}`;

/**
 * Fallback NLP extraction engine when AI APIs are unavailable or offline.
 * Guaranteed deterministic execution without failing.
 */
function extractJdFallback(jdText = "") {
  const jdLower = jdText.toLowerCase();

  // 1. Job Title extraction
  let job_title = "Software Engineer";
  const titleMatch = jdText.match(/(?:looking for|hiring|seeking|role of|position of|title:)\s+(?:a|an)?\s*([A-Z][A-Za-z0-9\s-]{4,35}?)(?=\s+to|\s+who|\s+with|\s+in|\.|\,|$)/i);
  if (titleMatch && titleMatch[1]) {
    job_title = titleMatch[1].trim();
  } else if (jdLower.includes("python developer")) job_title = "Senior Python Developer";
  else if (jdLower.includes("backend engineer") || jdLower.includes("backend developer")) job_title = "Backend Engineer";
  else if (jdLower.includes("frontend developer") || jdLower.includes("react developer")) job_title = "Frontend Developer";
  else if (jdLower.includes("full stack") || jdLower.includes("fullstack")) job_title = "Full Stack Engineer";
  else if (jdLower.includes("data scientist") || jdLower.includes("machine learning")) job_title = "Data Scientist";
  else if (jdLower.includes("ai engineer") || jdLower.includes("llm")) job_title = "AI & LLM Engineer";

  // 2. Tech Stack extraction
  const commonTechs = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "Django", "Flask", "FastAPI", "React", "React.js", "Next.js", "Vue.js", "Angular", "Node.js", "Express",
    "Spring Boot", "ASP.NET", "Ruby on Rails", "Tailwind CSS", "Bootstrap", "Redux", "GraphQL", "REST API",
    "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Elasticsearch", "Oracle", "Cassandra", "DynamoDB",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Google Cloud", "Terraform", "Git", "GitHub", "Jenkins", "CI/CD", "Linux"
  ];
  
  const foundTech = commonTechs.filter(tech => {
    const regex = new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i");
    return regex.test(jdText);
  });
  const tech_stack = foundTech.length > 0 ? foundTech : ["Not specified"];

  // 3. Experience extraction
  let experience = "Not specified";
  const expMatch = jdText.match(/(\d+[\+|-]?\s*(?:to\s*\d+)?\s*years?)/i);
  if (expMatch) {
    experience = expMatch[1].trim();
  } else if (jdLower.includes("entry-level") || jdLower.includes("entry level")) {
    experience = "Entry-level";
  } else if (jdLower.includes("senior level") || jdLower.includes("senior-level")) {
    experience = "Senior level";
  }

  // 4. DSA & Coding Requirements extraction
  let dsa_coding_requirements = "Not specified";
  const dsaRegex = /([^.\n]*(?:data structures|algorithms|leetcode|codeforces|competitive programming|algorithmic problem solving|system design|coding assessment|coding test)[^.\n]*[\.|\n])/i;
  const dsaMatch = jdText.match(dsaRegex);
  if (dsaMatch && dsaMatch[1]) {
    dsa_coding_requirements = dsaMatch[1].trim();
  } else if (/\b(dsa|algorithms?|data structures?)\b/i.test(jdLower)) {
    dsa_coding_requirements = "Requires demonstrated grasp of data structures, algorithms, and technical problem solving.";
  }

  // 5. Soft Skills extraction
  const softCatalog = [
    { key: "communication", label: "Communication" },
    { key: "mentor", label: "Mentoring" },
    { key: "leader", label: "Leadership" },
    { key: "team", label: "Teamwork & Collaboration" },
    { key: "agile", label: "Agile mindset" },
    { key: "problem solving", label: "Problem Solving" },
    { key: "critical thinking", label: "Critical Thinking" },
    { key: "time management", label: "Time Management" },
    { key: "adaptab", label: "Adaptability" }
  ];
  const foundSoft = [];
  softCatalog.forEach(item => {
    if (jdLower.includes(item.key)) {
      foundSoft.push(item.label);
    }
  });
  const soft_skills = foundSoft.length > 0 ? foundSoft : ["Not specified"];

  return {
    job_title,
    tech_stack,
    experience,
    dsa_coding_requirements,
    soft_skills
  };
}

/**
 * AI Agent designed to extract structural requirements from a Job Description.
 * Utilizes Mistral AI (or fallback LLMs) with structured text extraction prompt.
 */
export async function analyzeJobDescription(jdText = "") {
  if (!jdText || typeof jdText !== "string" || !jdText.trim()) {
    return {
      error: "No job description provided.",
      job_title: "Not specified",
      tech_stack: "Not specified",
      experience: "Not specified",
      dsa_coding_requirements: "Not specified",
      soft_skills: "Not specified"
    };
  }

  // Attempt evaluation via Mistral API if configured
  const apiKey = process.env.MISTRAL_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey && process.env.MISTRAL_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: process.env.MISTRAL_MODEL || "open-mistral-7b",
          messages: [
            { role: "system", content: JD_SYSTEM_PROMPT },
            { role: "user", content: jdText.trim() }
          ],
          temperature: 0.1
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        let content = response.data.choices[0].message.content;
        // Clean markdown syntax if wrapped in ```json ... ```
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonStr = content.substring(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(jsonStr);
          return {
            job_title: parsed.job_title || "Not specified",
            tech_stack: parsed.tech_stack || "Not specified",
            experience: parsed.experience || "Not specified",
            dsa_coding_requirements: parsed.dsa_coding_requirements || "Not specified",
            soft_skills: parsed.soft_skills || "Not specified",
            source: "mistral-ai"
          };
        }
      }
    } catch (err) {
      console.warn("AI JD Analyzer API unavailable or rate-limited, switching to deterministic extraction:", err.message);
    }
  }

  // Fallback deterministic extraction
  const fallbackResult = extractJdFallback(jdText);
  return {
    ...fallbackResult,
    source: "deterministic-nlp"
  };
}
