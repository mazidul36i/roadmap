import type { LessonBody } from "@content/types";
import { sdApiDesign, sdEstimation, sdFramework, sdStorage } from "./foundations";
import { sdCaching, sdConsistency, sdSharding } from "./data";
import { sdIdempotency, sdLoadBalancing, sdObservability, sdQueues, sdRateLimiting, sdSearch } from "./scale";

const lessons: LessonBody[] = [
  sdFramework,
  sdEstimation,
  sdApiDesign,
  sdStorage,
  sdCaching,
  sdSharding,
  sdConsistency,
  sdLoadBalancing,
  sdQueues,
  sdRateLimiting,
  sdIdempotency,
  sdObservability,
  sdSearch,
];

export default lessons;
