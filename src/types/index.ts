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
  languagePoints?: {
    python?: number;
    javascript?: number;
    c?: number;
    cpp?: number;
    java?: number;
  };
  selectedTitle?: string;
  duelsPlayed?: number;
  duelsWon?: number;
  duelsLost?: number;
  onboardingCompleted: boolean;
  privacyPolicyAccepted: boolean;
  termsAccepted: boolean;
  privacyPolicyVersion?: string;
  termsVersion?: string;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<this>;
}

export interface ITitleDefinition {
  id: string;
  title: string;
  description: string;
  category: "solves" | "streak" | "language" | "difficulty" | "duel";
}

export interface ILanguageSolve {
  _id: string;
  userId: string;
  problemId: string;
  language: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DuelStatus =
  | "WAITING"
  | "COUNTDOWN"
  | "ACTIVE"
  | "FINISHED"
  | "CANCELLED"
  | "EXPIRED";

export type DuelPlayerStatus = "CODING" | "SUBMITTED" | "SOLVED";

export interface IDuelPlayer {
  userId: string;
  username: string;
  displayName: string;
  image?: string;
  status: DuelPlayerStatus;
  submittedAt?: Date;
  testsPassed?: number;
  totalTests?: number;
  runtime?: number;
}

export interface IDuelRound {
  roundNumber: number; // 1, 2, 3
  problemId: string;
  problemTitle: string;
  difficulty: DifficultyLevel;
  startedAt?: Date;
  endsAt?: Date;
  winner?: string | null; // userId or null for draw/timeout
  finishedAt?: Date;
  player1Status: DuelPlayerStatus;
  player2Status: DuelPlayerStatus;
  player1SubmittedAt?: Date;
  player2SubmittedAt?: Date;
  player1TestsPassed?: number;
  player2TestsPassed?: number;
  player1TotalTests?: number;
  player2TotalTests?: number;
  player1Runtime?: number;
  player2Runtime?: number;
}

export interface IDuelRoom {
  _id: string;
  roomCode: string;
  difficulty: DifficultyLevel;
  rounds: number; // 3
  currentRound: number; // 1, 2, 3
  roundsData: IDuelRound[];
  player1: IDuelPlayer;
  player2?: IDuelPlayer;
  player1Score: number;
  player2Score: number;
  status: DuelStatus;
  countdownEndsAt?: Date;
  winner?: string | null; // final overall winner userId or null/DRAW
  finishedAt?: Date;
  finalizedAt?: Date; // crash-safe idempotency marker for statistics
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
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
  awardedLanguagePoints?: number;
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

export type ExecutionStatus =
  | "queued"
  | "running"
  | "success"
  | "error"
  | "timeout"
  | "failed"
  | "cancelled"
  | "expired";

export interface IExecution {
  _id: string;
  executionId: string;
  userId: string;
  queueId?: number | string;
  compiler: string;
  language: string;
  code: string;
  input?: string;
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  output?: string;
  exitCode?: number | null;
  signal?: string | null;
  time?: string | null;
  memory?: string | null;
  compilationError?: string;
  runtimeError?: string;
  isTimeout?: boolean;
  systemError?: string;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}


