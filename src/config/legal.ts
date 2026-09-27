/**
 * Centralized Legal & Consent Version Configuration for InsidCode
 *
 * All legal document versions and effective dates must be maintained here.
 * When legal terms are updated, incrementing these version constants will
 * automatically require existing users to review and re-consent.
 */

export const CURRENT_PRIVACY_POLICY_VERSION = "2026-09-20";
export const CURRENT_TERMS_VERSION = "2026-09-20";
export const CURRENT_COOKIE_POLICY_VERSION = "2026-09-20";

export const LEGAL_EFFECTIVE_DATE = "September 20, 2026";

export const LEGAL_DOCUMENT_ROUTES = {
  PRIVACY: "/privacy",
  TERMS: "/terms",
  INTEGRITY: "/integrity",
  CHANGELOG: "/changelog",
} as const;

export const LEGAL_VERSIONS = {
  PRIVACY_POLICY: CURRENT_PRIVACY_POLICY_VERSION,
  TERMS_OF_USE: CURRENT_TERMS_VERSION,
  COOKIE_POLICY: CURRENT_COOKIE_POLICY_VERSION,
} as const;

export interface UserConsentStatus {
  isCurrent: boolean;
  privacyPolicyCurrent: boolean;
  termsCurrent: boolean;
  cookiePolicyCurrent: boolean;
}

/**
 * Checks whether a user's stored legal consent matches the currently active versions.
 */
export function checkUserConsentStatus(user?: {
  privacyPolicyAccepted?: boolean;
  termsAccepted?: boolean;
  privacyPolicyVersion?: string | null;
  termsVersion?: string | null;
  cookiePolicyVersion?: string | null;
  legalConsent?: {
    accepted?: boolean;
    privacyPolicyVersion?: string | null;
    termsVersion?: string | null;
    cookiePolicyVersion?: string | null;
    acceptedAt?: Date | null;
    consentVersion?: string | null;
  } | null;
} | null): UserConsentStatus {
  if (!user) {
    return {
      isCurrent: false,
      privacyPolicyCurrent: false,
      termsCurrent: false,
      cookiePolicyCurrent: false,
    };
  }

  const privacyVersion = user.legalConsent?.privacyPolicyVersion ?? user.privacyPolicyVersion ?? null;
  const termsVersion = user.legalConsent?.termsVersion ?? user.termsVersion ?? null;
  const cookieVersion = user.legalConsent?.cookiePolicyVersion ?? user.cookiePolicyVersion ?? null;

  const isPrivacyAccepted = Boolean(user.legalConsent?.accepted || user.privacyPolicyAccepted);
  const isTermsAccepted = Boolean(user.legalConsent?.accepted || user.termsAccepted);

  const privacyPolicyCurrent = Boolean(
    isPrivacyAccepted && privacyVersion === CURRENT_PRIVACY_POLICY_VERSION
  );
  const termsCurrent = Boolean(
    isTermsAccepted && termsVersion === CURRENT_TERMS_VERSION
  );
  // Cookie policy consent: if user has accepted current terms/privacy, cookie policy version is acknowledged
  const cookiePolicyCurrent = Boolean(
    cookieVersion === CURRENT_COOKIE_POLICY_VERSION || (!cookieVersion && privacyPolicyCurrent && termsCurrent)
  );

  const isCurrent = privacyPolicyCurrent && termsCurrent;

  return {
    isCurrent,
    privacyPolicyCurrent,
    termsCurrent,
    cookiePolicyCurrent,
  };
}
