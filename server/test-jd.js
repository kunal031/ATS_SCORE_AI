import dotenv from "dotenv";
import { analyzeJobDescription } from "./utils/jdAnalyzer.js";

// Load environment variables (.env) so API keys are available
dotenv.config();

// ============================================================================
// 👉 PASTE YOUR JOB DESCRIPTION TEXT BELOW TO TEST:
// ============================================================================
const sampleJD = `
Job OverviewRole: Web DeveloperType: Full-Time / ContractGoal: Create fast, user-friendly, and secure digital experiences.Key ResponsibilitiesCoding: Write clean, efficient code using HTML, CSS, and JavaScript.Design Integration: Turn UI/UX design wireframes into working visual elements.Maintenance: Monitor site performance, troubleshoot bugs, and fix errors.Collaboration: Work with designers, product managers, and other team members.Optimization: Ensure fast loading speeds and mobile responsiveness.Requirements and SkillsLanguages: Proficiency in HTML, CSS, JavaScript, and related frameworks.Tools: Experience with Git version control and content management systems.Problem-Solving: Strong analytical skills to debug complex code.Education: Degree in Computer Science or equivalent practical experience.If you need this tailored, tell me:Is it for a front-end, back-end, or full-stack role?What is the experience level (Junior, Mid, Senior)?
`;

console.log("🤖 Sending Job Description to AI Agent for extraction...\n");

analyzeJobDescription(sampleJD)
  .then((result) => {
    console.log("✅ Extracted JSON Output:\n");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error("❌ Error running extraction:", err);
  });
