/**
 * Advanced ATS Keyword & Semantic Extraction Engine.
 * Directly inspired by domain classification techniques in AI-Resume-Analyzer.
 * Incorporates Stop-word filtering, Multi-word N-gram identification, and Keyword Density Matrix calculations.
 */

// Comprehensive set of standard English stop words and recruiter fluff words
const STOP_WORDS = new Set([
  "about", "above", "across", "after", "again", "against", "all", "almost", "alone", "along",
  "already", "also", "although", "always", "among", "and", "another", "any", "anyone", "anything",
  "anywhere", "are", "around", "as", "at", "back", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "cannot", "could", "did", "do", "does", "doing", "done",
  "down", "during", "each", "either", "else", "ever", "every", "everyone", "everything", "everywhere",
  "for", "from", "get", "got", "had", "has", "have", "having", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "however", "if", "in", "into", "is", "it", "its", "itself",
  "just", "like", "made", "make", "many", "may", "me", "might", "more", "most", "much", "must",
  "my", "myself", "never", "no", "none", "nor", "not", "nothing", "now", "nowhere", "of", "off",
  "on", "once", "one", "only", "or", "other", "others", "our", "ours", "ourselves", "out", "over",
  "own", "part", "per", "put", "said", "same", "see", "should", "since", "so", "some", "someone",
  "something", "somewhere", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
  "then", "there", "these", "they", "this", "those", "though", "through", "thus", "to", "too",
  "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were", "what",
  "whatever", "when", "whenever", "where", "whereas", "wherever", "whether", "which", "while",
  "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within", "without", "would",
  "yes", "yet", "you", "your", "yours", "yourself", "yourselves", "work", "working", "worked",
  "job", "team", "company", "project", "projects", "role", "responsible", "responsibilities",
  "years", "experience", "using", "include", "includes", "including", "application", "applications",
  "system", "systems", "problem", "solution", "solutions", "support", "environment", "business",
  "client", "clients", "services", "service", "high", "good", "strong", "excellent", "proven", "ability"
]);

// Domain technical skill dictionaries inspired by AI-Resume-Analyzer categories
export const DOMAIN_SKILL_DICTIONARY = {
  "Data Science & ML": [
    "tensorflow", "keras", "pytorch", "machine learning", "deep learning", "flask", "streamlit",
    "data visualization", "predictive analysis", "statistical modeling", "data mining",
    "clustering", "classification", "data analytics", "quantitative analysis", "web scraping",
    "ml algorithms", "scikit-learn", "probability", "pandas", "numpy", "nlp", "llm",
    "langchain", "huggingface", "scipy", "seaborn", "matplotlib", "computer vision", "opencv"
  ],
  "Web Development": [
    "react", "react.js", "react js", "django", "node.js", "node", "node js", "php", "laravel",
    "magento", "wordpress", "javascript", "typescript", "angular", "angular.js", "angular js",
    "c#", "asp.net", "flask", "next.js", "next js", "vue.js", "vue", "tailwind", "tailwindcss",
    "redux", "html", "html5", "css", "css3", "sass", "less", "bootstrap", "rest api", "graphql",
    "websocket", "microservices", "express", "nest.js", "fastify", "webpack", "vite", "jQuery"
  ],
  "Mobile Development": [
    "android", "android development", "flutter", "kotlin", "xml", "kivy", "ios",
    "ios development", "swift", "cocoa", "cocoa touch", "xcode", "objective-c", "react native", "ionic", "dart"
  ],
  "UI/UX & Design": [
    "ux", "adobe xd", "figma", "zeplin", "balsamiq", "ui", "prototyping", "wireframes",
    "adobe photoshop", "photoshop", "adobe illustrator", "illustrator", "after effects",
    "premiere pro", "indesign", "wireframe", "user research", "user experience",
    "responsive design", "design systems"
  ],
  "Cloud & DevOps": [
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd", "jenkins",
    "github actions", "gitlab ci", "ansible", "nginx", "apache", "linux", "bash", "shell",
    "containerization", "serverless", "lambda", "cloudfront", "s3", "ec2", "iam", "cloudformation", "devops", "git", "github"
  ],
  "Databases & Storage": [
    "mongodb", "postgresql", "mysql", "sqlite", "redis", "elasticsearch", "cassandra",
    "dynamodb", "oracle", "sql", "nosql", "firebase", "supabase", "prisma", "sequelize", "mongoose", "relational database"
  ],
  "Programming Languages": [
    "python", "java", "c++", "c", "ruby", "golang", "go", "rust", "c#", "scala", "perl",
    "r", "swift", "dart", "kotlin", "php", "javascript", "typescript", "sql", "bash"
  ],
  "Soft Skills & Management": [
    "leadership", "problem solving", "critical thinking", "communication", "team collaboration",
    "agile", "scrum", "kanban", "project management", "time management", "mentorship", "code review", "stakeholder management"
  ]
};

// Compile a sorted list of multi-word phrases (bi-grams, tri-grams) to match before breaking into single words
const MULTI_WORD_SKILLS = Object.values(DOMAIN_SKILL_DICTIONARY)
  .flat()
  .filter(term => term.includes(" ") || term.includes("."))
  .sort((a, b) => b.length - a.length); // match longest phrases first

/**
 * Normalizes text and extracts valid technical and descriptive keywords,
 * filtering out noise and recognizing multi-word N-grams.
 */
export const extractKeywords = (text = "") => {
  if (!text || typeof text !== "string") return [];
  
  let processedText = text.toLowerCase();
  const extracted = new Set();

  // 1. First sweep for known multi-word domain skills (N-grams and compound tokens like Node.js)
  for (const phrase of MULTI_WORD_SKILLS) {
    if (processedText.includes(phrase.toLowerCase())) {
      extracted.add(phrase.toLowerCase());
    }
  }

  // 2. Tokenize individual words and clean punctuation
  const words = processedText.match(/\b[a-z][a-z0-9+#.-]*[a-z0-9+#]\b|\b[a-z]{2,}\b/g) || [];
  
  for (const word of words) {
    const cleanWord = word.replace(/^[.-]+|[.-]+$/g, ""); // strip leading/trailing dots or dashes
    if (cleanWord.length >= 2 && !STOP_WORDS.has(cleanWord) && !/^\d+$/.test(cleanWord)) {
      extracted.add(cleanWord);
    }
  }

  return [...extracted];
};

/**
 * Categorizes extracted skills from document text into recognized tech domains.
 */
export const categorizeSkills = (text = "") => {
  const lowerText = (text || "").toLowerCase();
  const categorized = {};
  const flatSkills = new Set();

  for (const [category, skillList] of Object.entries(DOMAIN_SKILL_DICTIONARY)) {
    const matched = skillList.filter(skill => {
      // For short words (e.g. "c", "r", "ui", "ux"), match word boundary
      if (skill.length <= 2 || skill === "git" || skill === "sql" || skill === "aws") {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
        return regex.test(lowerText);
      }
      return lowerText.includes(skill);
    });

    if (matched.length > 0) {
      categorized[category] = matched;
      matched.forEach(s => flatSkills.add(s));
    }
  }

  return {
    categorized,
    uniqueSkills: [...flatSkills]
  };
};

/**
 * Computes a rigorous Keyword Density Matrix & Categorized Overlap Score between JD and Resume.
 * Returns deterministic comparison metrics to eliminate subjective score variance.
 */
export const computeKeywordDensityMatrix = (jobDescription = "", resumeText = "") => {
  const jdSkills = categorizeSkills(jobDescription);
  const resumeSkills = categorizeSkills(resumeText);

  const jdKeywords = new Set(extractKeywords(jobDescription));
  const resumeKeywords = new Set(extractKeywords(resumeText));

  // 1. Calculate Jaccard Similarity on overall meaningful vocabulary
  let intersectionCount = 0;
  const matchedKeywords = [];
  const missingKeywords = [];

  for (const kw of jdKeywords) {
    if (resumeKeywords.has(kw) || resumeText.toLowerCase().includes(kw)) {
      intersectionCount++;
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const vocabularyOverlap = jdKeywords.size > 0 
    ? Math.round((intersectionCount / jdKeywords.size) * 100) 
    : 100;

  // 2. Calculate Categorized Tech Stack Alignment
  const categoryEvaluations = {};
  let totalCatWeight = 0;
  let earnedCatWeight = 0;

  for (const [category, jdMatchedList] of Object.entries(jdSkills.categorized)) {
    const resMatchedList = resumeSkills.categorized[category] || [];
    const resSet = new Set(resMatchedList);
    
    let catMatched = 0;
    for (const term of jdMatchedList) {
      if (resSet.has(term)) catMatched++;
    }

    const catScore = jdMatchedList.length > 0 ? Math.round((catMatched / jdMatchedList.length) * 100) : 100;
    categoryEvaluations[category] = {
      jdCount: jdMatchedList.length,
      resumeCount: catMatched,
      score: catScore,
      skills: jdMatchedList
    };

    totalCatWeight += jdMatchedList.length * 10;
    earnedCatWeight += catMatched * 10;
  }

  const technicalCategoryScore = totalCatWeight > 0 
    ? Math.round((earnedCatWeight / totalCatWeight) * 100)
    : vocabularyOverlap;

  // 3. Compute deterministic composite density score (60% categorized tech stack + 40% clean keyword vocabulary)
  const densityScore = Math.min(100, Math.max(0, Math.round(technicalCategoryScore * 0.6 + vocabularyOverlap * 0.4)));

  return {
    densityScore,
    technicalCategoryScore,
    vocabularyOverlap,
    totalJDKeywords: jdKeywords.size,
    matchedKeywordCount: intersectionCount,
    matchedKeywords: matchedKeywords.slice(0, 25),
    missingKeywords: missingKeywords.slice(0, 15),
    categoryEvaluations,
    jdTechnicalSkills: jdSkills.uniqueSkills,
    resumeTechnicalSkills: resumeSkills.uniqueSkills
  };
};