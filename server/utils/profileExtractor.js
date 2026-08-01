/**
 * Utility to extract usernames and profiles for GitHub, LeetCode, Codeforces, and HackerRank from text or URLs.
 */
export const extractProfiles = (text = "", overrides = {}) => {
  const cleanText = text.toLowerCase();

  const results = {
    github: overrides.github || null,
    leetcode: overrides.leetcode || null,
    codeforces: overrides.codeforces || null,
    hackerrank: overrides.hackerrank || null,
  };

  // GitHub regex: github.com/username
  if (!results.github) {
    const ghMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    if (ghMatch && ghMatch[1] && !["login", "signup", "about", "explore"].includes(ghMatch[1].toLowerCase())) {
      results.github = ghMatch[1].trim();
    }
  }

  // LeetCode regex: leetcode.com/username or leetcode.com/u/username
  if (!results.leetcode) {
    const lcMatch = text.match(/leetcode\.com\/(?:u\/|profile\/|)([a-zA-Z0-9_-]+)/i);
    if (lcMatch && lcMatch[1] && !["login", "signup", "problemset", "contest", "discuss"].includes(lcMatch[1].toLowerCase())) {
      results.leetcode = lcMatch[1].trim();
    }
  }

  // Codeforces regex: codeforces.com/profile/username or codeforces.com/u/username
  if (!results.codeforces) {
    const cfMatch = text.match(/codeforces\.com\/(?:profile\/|u\/|)([a-zA-Z0-9_-]+)/i);
    if (cfMatch && cfMatch[1] && !["enter", "register", "contests", "problemset"].includes(cfMatch[1].toLowerCase())) {
      results.codeforces = cfMatch[1].trim();
    }
  }

  // HackerRank regex: hackerrank.com/username
  if (!results.hackerrank) {
    const hrMatch = text.match(/hackerrank\.com\/(?:profile\/|)([a-zA-Z0-9_-]+)/i);
    if (hrMatch && hrMatch[1] && !["login", "signup", "dashboard", "domains"].includes(hrMatch[1].toLowerCase())) {
      results.hackerrank = hrMatch[1].trim();
    }
  }

  return results;
};
