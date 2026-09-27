import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { User } from "@/models/User";
import {
  CURRENT_PRIVACY_POLICY_VERSION,
  CURRENT_TERMS_VERSION,
  CURRENT_COOKIE_POLICY_VERSION,
  checkUserConsentStatus,
} from "@/config/legal";

/**
 * POST /api/user/legal-consent
 *
 * Records a user's cookie consent preferences and/or legal re-consent.
 *
 * Body shapes accepted:
 *   1. Cookie preferences:
 *      { cookieConsent: { necessary: true, analytics: boolean, functional: boolean } }
 *
 *   2. Partial / Full legal re-consent:
 *      { privacyPolicyAccepted?: boolean, termsAccepted?: boolean }
 *
 *   3. Combined:
 *      { cookieConsent: {...}, privacyPolicyAccepted?: boolean, termsAccepted?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser({ allowIncompleteOnboarding: true });
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;
    const body = await req.json();

    const now = new Date();
    const updates: Record<string, unknown> = {};

    // ── Cookie consent ──
    if (body.cookieConsent && typeof body.cookieConsent === "object") {
      const cc = body.cookieConsent as {
        necessary?: boolean;
        analytics?: boolean;
        functional?: boolean;
      };

      updates["cookieConsent"] = {
        necessary: true, // strictly enforced server-side
        analytics: Boolean(cc.analytics),
        functional: Boolean(cc.functional),
        version: CURRENT_COOKIE_POLICY_VERSION,
        acceptedAt: now,
        updatedAt: now,
      };

      updates["cookiePolicyVersion"] = CURRENT_COOKIE_POLICY_VERSION;
      updates["legalConsent.cookiePolicyVersion"] = CURRENT_COOKIE_POLICY_VERSION;
    }

    // ── Privacy & Terms re-consent ──
    const currentStoredPrivacyVersion =
      user.legalConsent?.privacyPolicyVersion ?? user.privacyPolicyVersion;
    const currentStoredTermsVersion =
      user.legalConsent?.termsVersion ?? user.termsVersion;

    let isPrivacyCurrentlyValid = Boolean(
      (user.legalConsent?.accepted || user.privacyPolicyAccepted) &&
        currentStoredPrivacyVersion === CURRENT_PRIVACY_POLICY_VERSION
    );
    let isTermsCurrentlyValid = Boolean(
      (user.legalConsent?.accepted || user.termsAccepted) &&
        currentStoredTermsVersion === CURRENT_TERMS_VERSION
    );

    if (body.privacyPolicyAccepted === true) {
      updates["privacyPolicyAccepted"] = true;
      updates["privacyPolicyVersion"] = CURRENT_PRIVACY_POLICY_VERSION;
      updates["legalConsent.privacyPolicyVersion"] = CURRENT_PRIVACY_POLICY_VERSION;
      isPrivacyCurrentlyValid = true;
    }

    if (body.termsAccepted === true) {
      updates["termsAccepted"] = true;
      updates["termsVersion"] = CURRENT_TERMS_VERSION;
      updates["legalConsent.termsVersion"] = CURRENT_TERMS_VERSION;
      isTermsCurrentlyValid = true;
    }

    // If both documents are now valid, mark overall legal consent accepted with server timestamp
    if (isPrivacyCurrentlyValid && isTermsCurrentlyValid) {
      updates["legalConsent.accepted"] = true;
      updates["legalConsent.acceptedAt"] = now;
      updates["legalConsent.cookiePolicyVersion"] = CURRENT_COOKIE_POLICY_VERSION;
      updates["legalConsent.consentVersion"] = CURRENT_COOKIE_POLICY_VERSION;
      updates["acceptedAt"] = now;
      updates["consentVersion"] = CURRENT_COOKIE_POLICY_VERSION;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid consent fields provided." },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true }
    );

    const consentStatus = checkUserConsentStatus(updatedUser);

    return NextResponse.json({
      success: true,
      message: "Consent recorded successfully.",
      consentStatus,
    });
  } catch (error) {
    console.error("Legal consent update error:", error);
    return NextResponse.json(
      { error: "Failed to record consent." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/legal-consent
 * Returns the current user's consent status against the active legal versions.
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUser({ allowIncompleteOnboarding: true });
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;
    const consentStatus = checkUserConsentStatus(user);

    return NextResponse.json({
      isCurrent: consentStatus.isCurrent,
      privacyPolicyCurrent: consentStatus.privacyPolicyCurrent,
      termsCurrent: consentStatus.termsCurrent,
      cookiePolicyCurrent: consentStatus.cookiePolicyCurrent,
      acceptedAt: user.legalConsent?.acceptedAt ?? user.acceptedAt ?? null,
      versions: {
        current: {
          privacy: CURRENT_PRIVACY_POLICY_VERSION,
          terms: CURRENT_TERMS_VERSION,
          cookie: CURRENT_COOKIE_POLICY_VERSION,
        },
        stored: {
          privacy: user.legalConsent?.privacyPolicyVersion ?? user.privacyPolicyVersion ?? null,
          terms: user.legalConsent?.termsVersion ?? user.termsVersion ?? null,
          cookie: user.legalConsent?.cookiePolicyVersion ?? user.cookiePolicyVersion ?? null,
        },
      },
    });
  } catch (error) {
    console.error("Legal consent GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve consent status." },
      { status: 500 }
    );
  }
}
