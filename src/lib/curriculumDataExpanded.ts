import { QuestionSeedItem } from "./curriculumData";
import { CURRICULUM_ARRAYS } from "./curriculumDataArrays";
import { CURRICULUM_STRINGS } from "./curriculumDataStrings";
import { CURRICULUM_RECURSION } from "./curriculumDataRecursion";
import { CURRICULUM_ADVANCED } from "./curriculumDataAdvanced";
import { CURRICULUM_PLACEMENT } from "./curriculumDataPlacement";

export const EXPANDED_CURRICULUM_QUESTIONS: QuestionSeedItem[] = [
  ...CURRICULUM_ARRAYS,
  ...CURRICULUM_STRINGS,
  ...CURRICULUM_RECURSION,
  ...CURRICULUM_ADVANCED,
  ...CURRICULUM_PLACEMENT,
];
