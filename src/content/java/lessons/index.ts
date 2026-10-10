import type { LessonBody } from "@content/types";
import { javaCollections, javaEqualsHashCode, javaGenerics, javaStreams } from "./core";
import { javaExecutors, javaJvmGc, javaMemoryModel } from "./concurrency";
import { javaSolid, springBoot, springIoc, springJpa, springTransactions } from "./spring";

const lessons: LessonBody[] = [
  javaCollections,
  javaEqualsHashCode,
  javaGenerics,
  javaStreams,
  javaMemoryModel,
  javaExecutors,
  javaJvmGc,
  springIoc,
  springBoot,
  springTransactions,
  springJpa,
  javaSolid,
];

export default lessons;
