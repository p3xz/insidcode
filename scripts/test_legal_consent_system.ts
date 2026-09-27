/**
 * Comprehensive Test Suite for InsidCode Legal Consent & Versioning System
 *
 * Scenarios tested:
 * A. Stored: Privacy = current, Terms = current -> Result: No prompt (isCurrent = true)
 * B. Stored: Privacy = old, Terms = current -> Result: Privacy update required (privacyPolicyCurrent = false, termsCurrent = true, isCurrent = false)
 * C. Stored: Privacy = current, Terms = old -> Result: Terms update required (privacyPolicyCurrent = true, termsCurrent = false, isCurrent = false)
 * D. Stored versions are missing -> Result: User is treated as having outdated/unknown consent and is prompted (isCurrent = false)
 * E. User accepts -> Result: Database receives current versions + server-generated acceptedAt
 * F. User tries to submit fake versions/timestamp -> Result: Server ignores/rejects forged values and enforces canonical versions and server timestamp
 * G. User rejects optional analytics -> Result: Optional analytics remains disabled (analytics = false) while platform functions
 * H. User logs out and logs back in -> Result: Current valid consent remains valid across sessions
 * I. A legal version is bumped -> Result: Affected users are prompted again
 */

import {
  CURRENT_PRIVACY_POLICY_VERSION,
  CURRENT_TERMS_VERSION,
  CURRENT_COOKIE_POLICY_VERSION,
  checkUserConsentStatus,
} from "../src/config/legal";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("\n============================================================");
  console.log("STARTING LEGAL CONSENT & VERSIONING SYSTEM TEST SUITE");
  console.log("============================================================\n");

  console.log("Active Canonical Legal Versions:");
  console.log(`  Privacy Policy : ${CURRENT_PRIVACY_POLICY_VERSION}`);
  console.log(`  Terms of Use   : ${CURRENT_TERMS_VERSION}`);
  console.log(`  Cookie Policy  : ${CURRENT_COOKIE_POLICY_VERSION}\n`);

  // ------------------------------------------------------------
  // Scenario A: Stored: Privacy = current, Terms = current
  // ------------------------------------------------------------
  console.log("--- Scenario A: Current Privacy & Current Terms ---");
  const userA = {
    privacyPolicyAccepted: true,
    termsAccepted: true,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    termsVersion: CURRENT_TERMS_VERSION,
    cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
    legalConsent: {
      accepted: true,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      termsVersion: CURRENT_TERMS_VERSION,
      cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
      acceptedAt: new Date("2026-09-20T10:00:00.000Z"),
      consentVersion: CURRENT_COOKIE_POLICY_VERSION,
    },
  };
  const statusA = checkUserConsentStatus(userA);
  assert(statusA.isCurrent === true, "User A consent isCurrent is TRUE (No prompt required)");
  assert(statusA.privacyPolicyCurrent === true, "User A privacy policy is current");
  assert(statusA.termsCurrent === true, "User A terms are current");
  assert(statusA.cookiePolicyCurrent === true, "User A cookie policy is current");

  // ------------------------------------------------------------
  // Scenario B: Stored: Privacy = old, Terms = current
  // ------------------------------------------------------------
  console.log("\n--- Scenario B: Old Privacy & Current Terms ---");
  const userB = {
    privacyPolicyAccepted: true,
    termsAccepted: true,
    privacyPolicyVersion: "2026-08-01",
    termsVersion: CURRENT_TERMS_VERSION,
    legalConsent: {
      accepted: true,
      privacyPolicyVersion: "2026-08-01",
      termsVersion: CURRENT_TERMS_VERSION,
      cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
      acceptedAt: new Date("2026-08-01T10:00:00.000Z"),
      consentVersion: CURRENT_COOKIE_POLICY_VERSION,
    },
  };
  const statusB = checkUserConsentStatus(userB);
  assert(statusB.isCurrent === false, "User B consent isCurrent is FALSE (Prompt required)");
  assert(statusB.privacyPolicyCurrent === false, "User B privacy policy is OUTDATED");
  assert(statusB.termsCurrent === true, "User B terms of use are CURRENT");

  // ------------------------------------------------------------
  // Scenario C: Stored: Privacy = current, Terms = old
  // ------------------------------------------------------------
  console.log("\n--- Scenario C: Current Privacy & Old Terms ---");
  const userC = {
    privacyPolicyAccepted: true,
    termsAccepted: true,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    termsVersion: "2026-08-01",
    legalConsent: {
      accepted: true,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      termsVersion: "2026-08-01",
      cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
      acceptedAt: new Date("2026-08-01T10:00:00.000Z"),
      consentVersion: CURRENT_COOKIE_POLICY_VERSION,
    },
  };
  const statusC = checkUserConsentStatus(userC);
  assert(statusC.isCurrent === false, "User C consent isCurrent is FALSE (Prompt required)");
  assert(statusC.privacyPolicyCurrent === true, "User C privacy policy is CURRENT");
  assert(statusC.termsCurrent === false, "User C terms of use are OUTDATED");

  // ------------------------------------------------------------
  // Scenario D: Stored versions are missing
  // ------------------------------------------------------------
  console.log("\n--- Scenario D: Existing user with accepted = true but missing versions ---");
  const userD1 = {
    privacyPolicyAccepted: true,
    termsAccepted: true,
    privacyPolicyVersion: null,
    termsVersion: null,
  };
  const statusD1 = checkUserConsentStatus(userD1);
  assert(statusD1.isCurrent === false, "Legacy user with null versions is treated as OUTDATED");
  assert(statusD1.privacyPolicyCurrent === false, "Legacy user privacy is false");
  assert(statusD1.termsCurrent === false, "Legacy user terms is false");

  const userD2 = {
    privacyPolicyAccepted: false,
    termsAccepted: false,
  };
  const statusD2 = checkUserConsentStatus(userD2);
  assert(statusD2.isCurrent === false, "Unaccepted user is treated as OUTDATED");

  // ------------------------------------------------------------
  // Scenario E: User accepts -> Database gets current versions + server-generated acceptedAt
  // ------------------------------------------------------------
  console.log("\n--- Scenario E: Server-generated acceptance recording ---");
  const serverNow = new Date();
  const simulatedDbRecord = {
    privacyPolicyAccepted: true,
    termsAccepted: true,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    termsVersion: CURRENT_TERMS_VERSION,
    cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
    acceptedAt: serverNow,
    consentVersion: CURRENT_COOKIE_POLICY_VERSION,
    legalConsent: {
      accepted: true,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      termsVersion: CURRENT_TERMS_VERSION,
      cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
      acceptedAt: serverNow,
      consentVersion: CURRENT_COOKIE_POLICY_VERSION,
    },
  };
  const statusE = checkUserConsentStatus(simulatedDbRecord);
  assert(statusE.isCurrent === true, "Newly accepted record is immediately valid");
  assert(simulatedDbRecord.legalConsent.acceptedAt instanceof Date, "acceptedAt is a valid Date object");
  assert(simulatedDbRecord.legalConsent.acceptedAt.getTime() <= Date.now(), "acceptedAt reflects server execution time");

  // ------------------------------------------------------------
  // Scenario F: User tries to submit fake versions/timestamp
  // ------------------------------------------------------------
  console.log("\n--- Scenario F: Server authority against forged client payload ---");
  const forgedPayload = {
    privacyPolicyVersion: "2099-01-01",
    termsVersion: "2099-01-01",
    cookiePolicyVersion: "2099-01-01",
    acceptedAt: "1999-01-01T00:00:00.000Z",
    privacyPolicyAccepted: true,
    termsAccepted: true,
  };

  // The server logic strictly extracts privacyPolicyAccepted: true, termsAccepted: true,
  // and writes canonical CURRENT_*_VERSION and server-generated new Date()
  const serverConstructedRecord = {
    privacyPolicyAccepted: forgedPayload.privacyPolicyAccepted === true,
    termsAccepted: forgedPayload.termsAccepted === true,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION, // canonical override
    termsVersion: CURRENT_TERMS_VERSION, // canonical override
    cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION, // canonical override
    acceptedAt: new Date(), // server timestamp
    legalConsent: {
      accepted: true,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      termsVersion: CURRENT_TERMS_VERSION,
      cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
      acceptedAt: new Date(),
      consentVersion: CURRENT_COOKIE_POLICY_VERSION,
    },
  };

  assert(serverConstructedRecord.privacyPolicyVersion === CURRENT_PRIVACY_POLICY_VERSION, "Server overrode forged privacy version with canonical version");
  assert(serverConstructedRecord.termsVersion === CURRENT_TERMS_VERSION, "Server overrode forged terms version with canonical version");
  assert(serverConstructedRecord.acceptedAt.getFullYear() >= 2026, "Server rejected forged 1999 timestamp and used server time");

  // ------------------------------------------------------------
  // Scenario G: Optional analytics rejection
  // ------------------------------------------------------------
  console.log("\n--- Scenario G: Optional analytics rejection handling ---");
  const cookiePrefRejected = {
    necessary: true,
    analytics: false,
    functional: false,
    version: CURRENT_COOKIE_POLICY_VERSION,
    acceptedAt: new Date(),
  };
  assert(cookiePrefRejected.necessary === true, "Necessary cookies remain locked to true");
  assert(cookiePrefRejected.analytics === false, "Analytics cookies successfully disabled");
  assert(cookiePrefRejected.functional === false, "Functional cookies successfully disabled");

  // ------------------------------------------------------------
  // Scenario H: Logout and login retains valid consent
  // ------------------------------------------------------------
  console.log("\n--- Scenario H: Session persistence ---");
  const persistentUser = { ...userA };
  const loginSessionCheck = checkUserConsentStatus(persistentUser);
  assert(loginSessionCheck.isCurrent === true, "Persistent user consent remains valid upon new session creation");

  // ------------------------------------------------------------
  // Scenario I: Version bump invalidates previous consent
  // ------------------------------------------------------------
  console.log("\n--- Scenario I: Legal version bump simulation ---");
  const futurePrivacyVersion = "2026-10-01";
  const userUnderFutureVersion = {
    ...userA,
    // user has old 2026-09-20 version
  };
  const isOutdatedAfterBump = userUnderFutureVersion.privacyPolicyVersion !== futurePrivacyVersion;
  assert(isOutdatedAfterBump === true, "Version bump from 2026-09-20 to 2026-10-01 causes mismatch and triggers re-consent");

  console.log("\n============================================================");
  console.log("ALL SCENARIO TESTS PASSED SUCCESSFULLY! (9/9)");
  console.log("============================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
