export type UserRole = "user" | "admin";

export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export type SubmissionStatus =
  | "Accepted"
  | "Wrong Answer"
  | "Compilation Error"
  | "Runtime Error"
  | "Time Limit Exceeded"
  | "System Error";

export interface ExampleCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface StarterTemplates {
  python?: string;
  javascript?: string;
  c?: string;
  cpp?: string;
  java?: string;
}

export interface HiddenTestCase {
  input: string;
  expectedOutput: string;
}

export interface IUser {
  _id: string;
  username: string;
  usernameNormalized: string;
  displayName: string;
  email?: string;
  image?: string;
  provider: string;
  providerAccountId: string;
  role: UserRole;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string; // YYYY-MM-DD
  solvedProblems: string[]; // array of problemId
  attemptedProblems: string[]; // array of problemId
  totalSubmissions: number;
  acceptedSubmissions: number;
  leaderboardVisible: boolean;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: Date;
  bannedUntil?: Date;
  preferences?: {
    editorFontSize?: number;
    minimap?: boolean;
    defaultLanguage?: string;
    reducedMotion?: boolean;
    soundEnabled?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<this>;
}

export interface IQuestion {
  _id: string;
  problemId: string; // "001", "002"
  title: string;
  slug: string;
  phase: number; // 1 to 6
  difficulty: DifficultyLevel;
  description: string;
  constraints: string[];
  examples: ExampleCase[];
  starterTemplates: StarterTemplates;
  tags: string[];
  xp: number;
  hiddenTestCases: HiddenTestCase[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubmission {
  _id: string;
  userId: string;
  username: string;
  problemId: string;
  problemTitle: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  runtime?: number; // seconds
  memory?: number; // KB
  errorDetails?: string;
  testsPassed: number;
  totalTests: number;
  awardedXp: number;
  createdAt: Date;
}

export interface IFriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "achievement" | "friend_request" | "announcement" | "system";
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface IAchievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  iconName: string;
  requirementType: "solve_count" | "streak" | "phase_complete" | "difficulty_solve";
  requirementValue: number | string;
}

export interface IAdminAction {
  _id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetUserId?: string;
  targetProblemId?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ISystemConfig {
  key: string;
  leaderboardFrozen: boolean;
  frozenAt?: Date;
  announcement?: {
    active: boolean;
    title: string;
    message: string;
    updatedAt: Date;
  };
}
