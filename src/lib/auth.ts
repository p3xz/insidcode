import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { connectToDatabase } from "./mongodb";
import { User } from "@/models/User";
import { generateUniqueUsername } from "./username";
import { IUser } from "@/types";
import { checkUserConsentStatus, UserConsentStatus } from "@/config/legal";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  throw new Error(
    "[Auth Security] Critical: NEXTAUTH_SECRET or AUTH_SECRET environment variable is missing in production."
  );
}

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
      requiresLegalReconsent?: boolean;
      legalConsentStatus?: UserConsentStatus;
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
      userinfo: {
        url: "https://api.github.com/user",
        async request({
          tokens,
          provider,
        }: {
          tokens: { access_token?: string };
          provider: { userinfo?: { url?: string } };
        }) {
          const headers = {
            Authorization: `Bearer ${tokens.access_token}`,
            "User-Agent": "insidcode-auth",
          };
          const profile = await fetch(provider.userinfo?.url || "https://api.github.com/user", {
            headers,
          }).then((res) => res.json());

          try {
            const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
            if (emailsRes.ok) {
              const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
                await emailsRes.json();
              const primaryVerified = emails.find((e) => e.primary && e.verified);
              if (primaryVerified) {
                profile.email = primaryVerified.email;
                profile.email_verified = true;
              } else {
                profile.email_verified = false;
              }
            } else {
              profile.email_verified = false;
            }
          } catch {
            profile.email_verified = false;
          }
          return profile;
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          email_verified: profile.email_verified ?? false,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs starting with a single '/'
      if (url.startsWith("/")) {
        // Prevent protocol-relative redirects (e.g., //attacker.com)
        if (url.startsWith("//")) {
          return baseUrl;
        }
        return `${baseUrl}${url}`;
      }

      // Allow same-origin absolute URLs
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(baseUrl);
        if (parsedUrl.origin === parsedBase.origin) {
          return url;
        }
      } catch {
        return baseUrl;
      }

      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      if (!account || !account.provider || !account.providerAccountId) {
        console.warn("[Auth] Sign-in rejected: Missing account provider metadata.");
        return false;
      }

      const userEmail = user.email ? user.email.toLowerCase().trim() : undefined;

      // Verify email from provider
      let isEmailVerified = false;
      if (account.provider === "google") {
        isEmailVerified = Boolean((profile as { email_verified?: boolean })?.email_verified);
      } else if (account.provider === "github") {
        if ((profile as { email_verified?: boolean })?.email_verified) {
          isEmailVerified = true;
        } else if (account.access_token) {
          try {
            const emailsRes = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
                "User-Agent": "insidcode-auth",
              },
            });
            if (emailsRes.ok) {
              const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
                await emailsRes.json();
              const primaryVerified = emails.find((e) => e.primary && e.verified);
              if (primaryVerified && primaryVerified.email.toLowerCase().trim() === userEmail) {
                isEmailVerified = true;
              }
            }
          } catch (err) {
            console.error("[Auth] Error verifying GitHub email:", err);
          }
        }
      }

      if (!userEmail || !isEmailVerified) {
        console.warn(
          `[Auth] Sign-in rejected: Unverified or missing email for provider '${account.provider}'.`
        );
        return "/login?error=UnverifiedEmail";
      }

      try {
        await connectToDatabase();

        const isAdmin = checkIsAdminEmail(userEmail);

        // Strict lookup by provider and providerAccountId
        let dbUser = await User.findOne({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });

        if (!dbUser) {
          // Check if an account already exists with the same email under another provider
          const existingUserWithEmail = await User.findOne({ email: userEmail });
          if (existingUserWithEmail) {
            console.warn(
              `[Auth] Cross-provider account takeover prevented for ${userEmail}: existing provider '${existingUserWithEmail.provider}', attempted '${account.provider}'`
            );
            const originalProvider = existingUserWithEmail.provider || "another";
            return `/login?error=OAuthAccountNotLinked&provider=${encodeURIComponent(originalProvider)}`;
          }

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

          // Never overwrite provider or providerAccountId!

          // Ensure admin status is assigned if email matches ADMIN_EMAIL
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
          const dbUser = await User.findOne({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
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
            const consentStatus = checkUserConsentStatus(dbUser);
            token.requiresLegalReconsent = !consentStatus.isCurrent;
            token.legalConsentStatus = consentStatus;
            // NOTE: onboardingCompleted mirrors the raw DB flag. Legal re-consent
            // is handled separately via requiresLegalReconsent + the global
            // re-consent modal. ANDing consent currency here made the
            // OnboardingGuard bounce consent-outdated users between
            // /problems and /onboarding in an infinite redirect loop.
            token.onboardingCompleted = Boolean(dbUser.onboardingCompleted);
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
              const consentStatus = checkUserConsentStatus(dbUser);
              token.requiresLegalReconsent = !consentStatus.isCurrent;
              token.legalConsentStatus = consentStatus;
              // NOTE: mirrors the raw DB flag; see comment above. ANDing
              // consent currency here caused an infinite /problems <->
              // /onboarding redirect loop for consent-outdated users.
              token.onboardingCompleted = Boolean(dbUser.onboardingCompleted);
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
            .select("username displayName role xp currentStreak isBanned onboardingCompleted privacyPolicyAccepted termsAccepted privacyPolicyVersion termsVersion cookiePolicyVersion legalConsent requiresRestorationConsent restoredAt preferences")
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
            const consentStatus = checkUserConsentStatus(dbUser);
            token.requiresLegalReconsent = !consentStatus.isCurrent;
            token.legalConsentStatus = consentStatus;
            const needsLegalConsent = !consentStatus.isCurrent;
            token.requiresRestorationConsent = Boolean(
              (dbUser.requiresRestorationConsent || dbUser.restoredAt) && needsLegalConsent
            );
            // NOTE: onboardingCompleted mirrors the raw DB flag. Legal re-consent
            // is handled separately via requiresLegalReconsent + the global
            // re-consent modal. ANDing consent currency here made the
            // OnboardingGuard bounce consent-outdated users between
            // /problems and /onboarding in an infinite redirect loop.
            token.onboardingCompleted = Boolean(dbUser.onboardingCompleted);
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
        session.user.requiresLegalReconsent = Boolean(token.requiresLegalReconsent);
        session.user.legalConsentStatus = (token.legalConsentStatus as UserConsentStatus) || undefined;
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

    const consentStatus = checkUserConsentStatus(dbUser);
    const hasCompletedOnboarding = Boolean(
      dbUser.onboardingCompleted && consentStatus.isCurrent
    );

    if (!options?.allowIncompleteOnboarding && !hasCompletedOnboarding) {
      return {
        user: null,
        error: "Legal consent or onboarding update required before proceeding.",
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
