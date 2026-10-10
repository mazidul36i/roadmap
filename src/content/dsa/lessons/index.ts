import type { LessonBody } from "@content/types";
import hashing from "./hashing";
import twoPointers from "./two-pointers";
import slidingWindow from "./sliding-window";
import prefixSum from "./prefix-sum";
import binarySearch from "./binary-search";
import fastSlow from "./fast-slow-pointers";
import monotonicStack from "./monotonic-stack";
import intervals from "./intervals";
import heapTopK from "./heap-top-k";
import treeTraversal from "./tree-traversal";
import graphTraversal from "./graph-traversal";
import backtracking from "./backtracking";
import trie from "./trie";
import topologicalSort from "./topological-sort";
import unionFind from "./union-find";
import dijkstra from "./dijkstra";
import greedy from "./greedy";
import dp1d from "./dp-1d";
import dp2d from "./dp-2d";

const lessons: LessonBody[] = [
  hashing,
  twoPointers,
  slidingWindow,
  prefixSum,
  binarySearch,
  fastSlow,
  monotonicStack,
  intervals,
  heapTopK,
  treeTraversal,
  graphTraversal,
  backtracking,
  trie,
  topologicalSort,
  unionFind,
  dijkstra,
  greedy,
  dp1d,
  dp2d,
];

export default lessons;
