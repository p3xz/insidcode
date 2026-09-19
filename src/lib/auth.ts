import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { connectToDatabase } from "./mongodb";
import { User } from "@/models/User";
import { generateUniqueUsername } from "./username";
import { IUser } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string;
      role: "user" | "admin";
      xp: number;
      currentStreak: number;
      isBanned: boolean;
      onboardingCompleted: boolean;
      requiresRestorationConsent?: boolean;
      defaultLanguage?: string;
      preferences?: {
        editorFontSize?: number;
        minimap?: boolean;
        defaultLanguage?: string;
        reducedMotion?: boolean;
        soundEnabled?: boolean;
      };
    } & DefaultSession["user"];
  }
}

function checkIsAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmailEnv = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!adminEmailEnv) return false;
  const normalized = email.toLowerCase().trim();
  return normalized === adminEmailEnv;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !account.provider || !account.providerAccountId) {
        console.warn("[Auth] Sign-in rejected: Missing account provider metadata.");
        return false;
      }

      try {
        await connectToDatabase();

        const userEmail = user.email ? user.email.toLowerCase().trim() : undefined;
        const isAdmin = checkIsAdminEmail(userEmail);

        // Find existing user by provider account ID or email
        let dbUser = await User.findOne({
          $or: [
            { provider: account.provider, providerAccountId: account.providerAccountId },
            ...(userEmail ? [{ email: userEmail }] : []),
          ],
        });

        if (!dbUser) {
          const rawName = user.name || (userEmail ? userEmail.split("@")[0] : "coder");
          const username = await generateUniqueUsername(rawName);

          dbUser = await User.create({
            username,
            usernameNormalized: username.toLowerCase(),
            displayName: user.name || username,
            email: userEmail,
            image: user.image || undefined,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            role: isAdmin ? "admin" : "user",
            xp: 0,
            currentStreak: 0,
            longestStreak: 0,
            solvedProblems: [],
            attemptedProblems: [],
            totalSubmissions: 0,
            acceptedSubmissions: 0,
            leaderboardVisible: true,
            isBanned: false,
            preferences: {
              editorFontSize: 14,
              minimap: false,
              defaultLanguage: "java",
              reducedMotion: false,
              soundEnabled: false,
            },
            onboardingCompleted: false,
            privacyPolicyAccepted: false,
            termsAccepted: false,
          });
          console.log(`[Auth] Created new user: ${dbUser.username} (Role: ${dbUser.role})`);
        } else {
          let hasUpdates = false;

          // Link provider info if matched via email
          if (dbUser.provider !== account.provider || dbUser.providerAccountId !== account.providerAccountId) {
            dbUser.provider = account.provider;
            dbUser.providerAccountId = account.providerAccountId;
            hasUpdates = true;
          }

          // Ensure admin status is assigned
          if (isAdmin && dbUser.role !== "admin") {
            dbUser.role = "admin";
            hasUpdates = true;
            console.log(`[Auth] Promoted user ${dbUser.username} (${userEmail}) to admin role.`);
          }

          if (user.image && dbUser.image !== user.image) {
            dbUser.image = user.image;
            hasUpdates = true;
          }

          if (hasUpdates) {
            await dbUser.save();
          }
        }

        return true;
      } catch (error) {
        console.error("[Auth] Sign-in database sync error:", error);
        return false;
      }
    },
    async jwt({ token, account, user, trigger, session }) {
      if (account && user) {
        try {
          await connectToDatabase();
          const userEmail = user.email ? user.email.toLowerCase().trim() : undefined;

          const dbUser = await User.findOne({
            $or: [
              { provider: account.provider, providerAccountId: account.providerAccountId },
              ...(userEmail ? [{ email: userEmail }] : []),
            ],
          });

          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.username = dbUser.username;
            token.displayName = dbUser.displayName;
            token.role = dbUser.role;
            token.xp = dbUser.xp;
            token.currentStreak = dbUser.currentStreak;
            token.isBanned = dbUser.isBanned;
            token.defaultLanguage = dbUser.preferences?.defaultLanguage || "java";
            token.preferences = dbUser.preferences || { defaultLanguage: "java" };
            token.onboardingCompleted = Boolean(
              dbUser.onboardingCompleted &&
              dbUser.privacyPolicyAccepted &&
              dbUser.termsAccepted
            );
          }
        } catch (error) {
          console.error("[Auth] JWT database sync error:", error);
        }
      }

      // Handle session update triggers (e.g. when username is changed, preferences updated, or onboarding completed)
      if (trigger === "update") {
        if (session?.username && typeof session.username === "string") {
          token.username = session.username;
        }
        if (session?.onboardingCompleted !== undefined) {
          token.onboardingCompleted = Boolean(session.onboardingCompleted);
        }
        if (session?.preferences) {
          token.preferences = { ...((token.preferences as object) || {}), ...session.preferences };
          if (session.preferences.defaultLanguage) {
            token.defaultLanguage = session.preferences.defaultLanguage;
          }
        }
        if (session?.defaultLanguage) {
          token.defaultLanguage = session.defaultLanguage;
        }

        if (token.userId) {
          try {
            await connectToDatabase();
            const dbUser = await User.findById(token.userId);
            if (dbUser) {
              token.username = dbUser.username;
              token.displayName = dbUser.displayName;
              token.role = dbUser.role;
              token.xp = dbUser.xp;
              token.currentStreak = dbUser.currentStreak;
              token.isBanned = dbUser.isBanned;
              token.defaultLanguage = dbUser.preferences?.defaultLanguage || "java";
              token.preferences = dbUser.preferences || { defaultLanguage: "java" };
              token.onboardingCompleted = Boolean(
                dbUser.onboardingCompleted &&
                dbUser.privacyPolicyAccepted &&
                dbUser.termsAccepted
              );
            }
          } catch (error) {
            console.error("[Auth] JWT session refresh error:", error);
          }
        }
        return token;
      }

      // Authoritative synchronization on session retrieval: ensure token reflects latest DB user state
      if (token.userId) {
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.userId)
            .select("username displayName role xp currentStreak isBanned onboardingCompleted privacyPolicyAccepted termsAccepted requiresRestorationConsent restoredAt preferences")
            .lean();

          if (dbUser) {
            token.username = dbUser.username;
            token.displayName = dbUser.displayName;
            token.role = dbUser.role;
            token.xp = dbUser.xp;
            token.currentStreak = dbUser.currentStreak;
            token.isBanned = dbUser.isBanned;
            token.defaultLanguage = dbUser.preferences?.defaultLanguage || "java";
            token.preferences = dbUser.preferences || { defaultLanguage: "java" };
            const needsLegalConsent = !dbUser.privacyPolicyAccepted || !dbUser.termsAccepted;
            token.requiresRestorationConsent = Boolean(
              (dbUser.requiresRestorationConsent || dbUser.restoredAt) && needsLegalConsent
            );
            token.onboardingCompleted = Boolean(
              dbUser.onboardingCompleted &&
              dbUser.privacyPolicyAccepted &&
              dbUser.termsAccepted
            );
          }
        } catch (error) {
          console.error("[Auth] JWT auto-sync error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) || "";
        session.user.username = (token.username as string) || "";
        session.user.displayName = (token.displayName as string) || (token.username as string) || "";
        session.user.role = (token.role as "user" | "admin") || "user";
        session.user.xp = (token.xp as number) || 0;
        session.user.currentStreak = (token.currentStreak as number) || 0;
        session.user.isBanned = (token.isBanned as boolean) || false;
        session.user.onboardingCompleted = (token.onboardingCompleted as boolean) || false;
        session.user.requiresRestorationConsent = (token.requiresRestorationConsent as boolean) || false;
        session.user.defaultLanguage =
          (token.defaultLanguage as string) ||
          (token.preferences as { defaultLanguage?: string })?.defaultLanguage ||
          "java";
        session.user.preferences =
          (token.preferences as {
            editorFontSize?: number;
            minimap?: boolean;
            defaultLanguage?: string;
            reducedMotion?: boolean;
            soundEnabled?: boolean;
          }) || { defaultLanguage: session.user.defaultLanguage };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export async function getAuthenticatedUser(options?: {
  allowIncompleteOnboarding?: boolean;
}): Promise<{
  user: IUser | null;
  error?: string;
  status: number;
}> {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return { user: null, error: "Unauthorized. Please sign in.", status: 401 };
    }

    await connectToDatabase();
    const dbUser = await User.findById(session.user.id);

    if (!dbUser) {
      return { user: null, error: "User record not found.", status: 404 };
    }

    if (dbUser.isBanned) {
      if (dbUser.bannedUntil && new Date() > new Date(dbUser.bannedUntil)) {
        // Temporary ban expired
        dbUser.isBanned = false;
        dbUser.banReason = undefined;
        dbUser.bannedUntil = undefined;
        await dbUser.save();
      } else {
        const reason = dbUser.banReason ? `: ${dbUser.banReason}` : "";
        return {
          user: null,
          error: `Your account has been suspended${reason}`,
          status: 403,
        };
      }
    }

    const hasCompletedOnboarding = Boolean(
      dbUser.onboardingCompleted &&
      dbUser.privacyPolicyAccepted &&
      dbUser.termsAccepted
    );

    if (!options?.allowIncompleteOnboarding && !hasCompletedOnboarding) {
      return {
        user: null,
        error: "Onboarding and consent required before proceeding.",
        status: 403,
      };
    }

    return { user: dbUser, status: 200 };
  } catch (error) {
    console.error("[Auth] Verification error:", error);
    return { user: null, error: "Authentication check failed.", status: 500 };
  }
}

export async function requireAdminUser(): Promise<{
  admin: IUser | null;
  user?: IUser | null;
  error?: string;
  status: number;
}> {
  const authResult = await getAuthenticatedUser();
  if (!authResult.user) {
    return { admin: null, user: null, error: authResult.error, status: authResult.status };
  }

  if (authResult.user.role !== "admin") {
    return { admin: null, user: authResult.user, error: "Forbidden. Admin access required.", status: 403 };
  }

  return { admin: authResult.user, user: authResult.user, status: 200 };
}
