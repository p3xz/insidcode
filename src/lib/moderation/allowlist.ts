/**
 * Legitimate Exceptions & False-Positive Allowlist
 *
 * Prevents the Scunthorpe problem where legitimate vocabulary, technical terms,
 * names, or programming identifiers contain substrings matching bad words.
 *
 * Every allowed term below is explicitly documented with the rationale for exemption.
 */

export const ALLOWED_TERMS: ReadonlySet<string> = new Set([
  // --- Programming & Syntax terms containing "ass" ---
  "class", // Standard OOP keyword in Java, C++, JS, Python
  "classic", // Common aesthetic/design adjective
  "pass", // Python keyword, password abbreviation
  "passport", // Standard identification/auth term
  "compass", // Navigation / UI metaphor
  "grass", // Common natural noun
  "glass", // UI styling (glassmorphism), common noun
  "bass", // Musical term, audio setting
  "mass", // Physics / calculation term
  "assess", // Evaluation / test term
  "assessment", // Academic testing term
  "asset", // Static asset / web development resource
  "assign", // Variable assignment
  "assistant", // AI / helper assistant
  "associate", // Data relation
  "assume", // Logical deduction
  "assembly", // Assembly language (ASM)
  "assembler", // Compiler assembler
  "assassin", // Common game/avatar title

  // --- Terms containing "cock" ---
  "cockpit", // Developer dashboard / UI layout term
  "peacock", // Bird name, branding
  "hancock", // Historical / common surname

  // --- Analytics & Mathematical terms containing "anal" ---
  "analyst", // Data analyst profession
  "analytics", // Web and usage analytics
  "analyze", // Algorithmic code analysis
  "analysis", // Algorithmic time/space complexity analysis
  "analog", // Analog signals / computing
  "analogous", // Comparative term

  // --- Terms containing "cum" ---
  "document", // Software documentation / DOM document
  "documentation", // API reference / docs
  "dock", // UI docking / container dock
  "docker", // Container virtualization tooling
  "cucumber", // BDD test framework / food
  "cumulate", // Math accumulation
  "accumulate", // C++ std::accumulate algorithm

  // --- Terms containing "tit" ---
  "title", // HTML title / problem title
  "entity", // Database entity / ORM model
  "quantity", // Numerical measure
  "identity", // User authentication / identity
  "competition", // Coding contest
  "partition", // Array partitioning (e.g. QuickSelect)
  "stitched", // General verb
  "attitude", // General noun

  // --- Terms containing "shit" or "hit" ---
  "hit", // Cache hit, search hit
  "shift", // Bitwise shift operator (`<<`, `>>`), array shift
  "shitake", // Mushroom variety
  "snapshot", // State snapshot, testing snapshot

  // --- Terms containing "dick" ---
  "dickens", // Charles Dickens, literary reference
  "dickinson", // Emily Dickinson, surname

  // --- Famous Scunthorpe / Geographic Names ---
  "scunthorpe", // Town in North Lincolnshire (benchmark for filter false-positives)
  "penistone", // Town in South Yorkshire

  // --- Core Platform & Developer Terms ---
  "insidcode", // Official platform name
  "wheatcode", // Project workspace code name
  "code",
  "coder",
  "developer",
  "algo",
  "algorithm",
  "python",
  "java",
  "javascript",
  "cpp",
  "rust",
  "golang",
  "github",
  "google",
]);

/**
 * Checks if a given normalized token matches an allowlisted legitimate word.
 */
export function isAllowlisted(word: string): boolean {
  return ALLOWED_TERMS.has(word.toLowerCase());
}
