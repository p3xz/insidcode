/**
 * Build-time Catalog Integrity Checker
 *
 * Verifies that the published curriculum questions dataset is non-empty,
 * well-formed, and strictly satisfies canonical format rules.
 */

import { CURRICULUM_QUESTIONS } from "../src/lib/curriculumData";
import { normalizeProblemIdentifier } from "../src/lib/problems";

function runCatalogVerification() {
  console.log("🔍 Checking curriculum catalog integrity...");

  if (!Array.isArray(CURRICULUM_QUESTIONS) || CURRICULUM_QUESTIONS.length === 0) {
    console.error("❌ CRITICAL: CURRICULUM_QUESTIONS is empty or undefined!");
    process.exit(1);
  }

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (let i = 0; i < CURRICULUM_QUESTIONS.length; i++) {
    const q = CURRICULUM_QUESTIONS[i];
    const norm = normalizeProblemIdentifier(q.problemId);

    if (!norm.valid) {
      console.error(`❌ Question index ${i} has invalid problemId: "${q.problemId}"`);
      process.exit(1);
    }

    if (!norm.isCanonical) {
      console.error(`❌ Question index ${i} problemId is non-canonical: "${q.problemId}" (expected "${norm.canonicalId}")`);
      process.exit(1);
    }

    if (seenIds.has(q.problemId)) {
      console.error(`❌ Duplicate problemId found: "${q.problemId}"`);
      process.exit(1);
    }
    seenIds.add(q.problemId);

    if (seenSlugs.has(q.slug)) {
      console.error(`❌ Duplicate slug found: "${q.slug}"`);
      process.exit(1);
    }
    seenSlugs.add(q.slug);

    if (!q.title || !q.difficulty || !q.phase) {
      console.error(`❌ Question ${q.problemId} missing required fields (title, difficulty, or phase)`);
      process.exit(1);
    }
  }

  console.log(`✅ Catalog integrity verified: ${CURRICULUM_QUESTIONS.length} questions are valid and canonical.\n`);
}

runCatalogVerification();
