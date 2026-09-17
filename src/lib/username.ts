import { LIMITS, RESERVED_USERNAMES } from "./constants";
import { User } from "@/models/User";
import { connectToDatabase } from "./mongodb";
import { validateUsernameModeration, UsernameValidationResult } from "./moderation/usernameModeration";

export function isReservedUsername(username: string): boolean {
  const normalized = username.toLowerCase().trim();
  return (RESERVED_USERNAMES as readonly string[]).includes(normalized);
}

export function isValidUsernameFormat(username: string): boolean {
  const regex = /^[A-Za-z0-9_]{3,20}$/;
  return regex.test(username);
}

export function validateUsername(username: string): UsernameValidationResult {
  return validateUsernameModeration(username);
}

export function sanitizeOAuthNameToUsername(rawName: string): string {
  // Replace spaces and special characters with underscore or remove them
  let sanitized = rawName
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");

  if (sanitized.length < LIMITS.USERNAME_MIN) {
    sanitized = `user_${sanitized}`.replace(/[^A-Za-z0-9_]/g, "");
  }

  if (sanitized.length > LIMITS.USERNAME_MAX) {
    sanitized = sanitized.substring(0, LIMITS.USERNAME_MAX);
  }

  if (!isValidUsernameFormat(sanitized) || !validateUsernameModeration(sanitized).allowed) {
    sanitized = `user_${Date.now().toString().slice(-6)}`;
  }

  return sanitized;
}

export async function generateUniqueUsername(preferredName: string): Promise<string> {
  await connectToDatabase();

  let baseUsername = sanitizeOAuthNameToUsername(preferredName);

  // If reserved or prohibited, replace with safe random base
  if (!validateUsernameModeration(baseUsername).allowed) {
    baseUsername = `coder_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Check if base is available
  const existing = await User.findOne({ usernameNormalized: baseUsername.toLowerCase() });
  if (!existing && validateUsernameModeration(baseUsername).allowed) {
    return baseUsername;
  }

  // Try appending numbers within length limit
  for (let attempt = 1; attempt <= 9999; attempt++) {
    const suffix = attempt.toString();
    const maxBaseLen = LIMITS.USERNAME_MAX - suffix.length;
    const truncatedBase = baseUsername.substring(0, maxBaseLen);
    const candidate = `${truncatedBase}${suffix}`;

    if (validateUsernameModeration(candidate).allowed) {
      const collision = await User.findOne({ usernameNormalized: candidate.toLowerCase() });
      if (!collision) {
        return candidate;
      }
    }
  }

  // Fallback unique random string
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `user_${randomSuffix}`;
}
