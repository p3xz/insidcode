// Centralized limits for insidcode platform
export const LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  DISPLAY_NAME_MAX: 40,
  BIO_MAX: 160,
  SEARCH_MAX: 100,
  CODE_MAX_BYTES: 100 * 1024, // 100 KB
  CUSTOM_INPUT_MAX_BYTES: 32 * 1024, // 32 KB
  PROBLEM_TITLE_MAX: 120,
  EXECUTION_TIMEOUT_MS: 10000, // 10 seconds
  MAX_PAGE_SIZE: 50,
  DEFAULT_PAGE_SIZE: 20,
} as const;

export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "insidcode",
  "system",
  "root",
  "superuser",
  "api",
  "mod",
  "moderator",
  "support",
  "help",
  "staff",
] as const;

export const XP_REWARDS = {
  Easy: 10,
  Medium: 20,
  Hard: 30,
} as const;

export const CURRICULUM_PHASES = [
  { id: 1, title: "Conditional Thinking", description: "Mastering conditional logic, branching, boolean algebra and decisions." },
  { id: 2, title: "Looping and Patterns", description: "Iterative logic, nested loops, series, sequences and pattern printing." },
  { id: 3, title: "Recursion", description: "Base cases, recursive state transitions, call stacks and divide-and-conquer." },
  { id: 4, title: "Basic Arrays", description: "Linear scans, subarrays, two pointers, prefix sums and transformations." },
  { id: 5, title: "Strings", description: "Character manipulation, substring matching, palindrome verification and parsing." },
  { id: 6, title: "Mixed Logical Challenges", description: "Comprehensive algorithmic problem solving combining multiple foundational concepts." },
] as const;

export const SUPPORTED_LANGUAGES = [
  { id: "python", name: "Python 3", pistonLanguage: "python", version: "3.10.0", monacoId: "python" },
  { id: "javascript", name: "JavaScript", pistonLanguage: "javascript", version: "18.15.0", monacoId: "javascript" },
  { id: "c", name: "C", pistonLanguage: "c", version: "10.2.0", monacoId: "c" },
  { id: "cpp", name: "C++", pistonLanguage: "cpp", version: "10.2.0", monacoId: "cpp" },
  { id: "java", name: "Java", pistonLanguage: "java", version: "15.0.2", monacoId: "java" },
] as const;

export type SupportedLanguageId = (typeof SUPPORTED_LANGUAGES)[number]["id"];
