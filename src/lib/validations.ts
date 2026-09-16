import { z } from "zod";
import { LIMITS } from "./constants";

export const UsernameSchema = z
  .string()
  .trim()
  .min(LIMITS.USERNAME_MIN, `Username must be at least ${LIMITS.USERNAME_MIN} characters`)
  .max(LIMITS.USERNAME_MAX, `Username cannot exceed ${LIMITS.USERNAME_MAX} characters`)
  .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  .refine((val) => !/\s/.test(val), "Username cannot contain spaces");

export const UsernameUpdateSchema = z.object({
  username: UsernameSchema,
});

export const DisplayNameSchema = z
  .string()
  .min(1, "Display name is required")
  .max(LIMITS.DISPLAY_NAME_MAX, `Display name cannot exceed ${LIMITS.DISPLAY_NAME_MAX} characters`);

export const OnboardingSchema = z.object({
  username: UsernameSchema,
  displayName: DisplayNameSchema.optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Privacy Policy and Terms of Use to continue." }),
  }),
});

export const BioSchema = z
  .string()
  .max(LIMITS.BIO_MAX, `Bio cannot exceed ${LIMITS.BIO_MAX} characters`)
  .optional();

export const CodeExecutionSchema = z.object({
  language: z.enum(["python", "javascript", "c", "cpp", "java"]),
  code: z
    .string()
    .min(1, "Code cannot be empty")
    .max(LIMITS.CODE_MAX_BYTES, "Code exceeds maximum size of 100 KB"),
  customInput: z
    .string()
    .max(LIMITS.CUSTOM_INPUT_MAX_BYTES, "Custom input exceeds maximum size of 32 KB")
    .default(""),
});

export const CodeSubmissionSchema = z.object({
  problemId: z.string().min(1, "Problem ID is required"),
  language: z.enum(["python", "javascript", "c", "cpp", "java"]),
  code: z
    .string()
    .min(1, "Code cannot be empty")
    .max(LIMITS.CODE_MAX_BYTES, "Code exceeds maximum size of 100 KB"),
});

export const ProfileUpdateSchema = z.object({
  username: UsernameSchema.optional(),
  displayName: DisplayNameSchema.optional(),
  bio: BioSchema,
  preferences: z
    .object({
      editorFontSize: z.number().min(10).max(28).optional(),
      minimap: z.boolean().optional(),
      defaultLanguage: z.enum(["python", "javascript", "c", "cpp", "java"]).optional(),
      reducedMotion: z.boolean().optional(),
      soundEnabled: z.boolean().optional(),
    })
    .optional(),
});

export const AdminUserUpdateSchema = z.object({
  userId: z.string().min(1),
  isBanned: z.boolean().optional(),
  banReason: z.string().max(300).optional(),
  bannedUntil: z.string().datetime().nullable().optional(),
  leaderboardVisible: z.boolean().optional(),
  xpChange: z.number().int().optional(),
  xpReason: z.string().max(300).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const AdminAnnouncementSchema = z.object({
  active: z.boolean(),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
});
