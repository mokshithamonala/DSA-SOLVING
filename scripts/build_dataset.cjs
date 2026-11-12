// Dataset compiler for CodeOrbit 450+ verified LeetCode Easy questions
const fs = require('fs');
const path = require('path');

// Topics list corresponding to the 6 roadmap phases
const topicsList = [
  // Phase 1 — Fundamentals
  { id: 'arrays', name: 'Arrays', slug: 'arrays', phase: 'Phase 1: Fundamentals', display_order: 1, description: 'Master continuous memory, index arithmetic, two-pass traversals, and in-place transformations.' },
  { id: 'strings', name: 'Strings', slug: 'strings', phase: 'Phase 1: Fundamentals', display_order: 2, description: 'String manipulations, parsing, anagrams, palindrome verification, and pattern matching.' },
  { id: 'hash-tables', name: 'Hash Tables', slug: 'hash-tables', phase: 'Phase 1: Fundamentals', display_order: 3, description: 'O(1) lookups, frequency maps, set intersections, complement checks, and bucket tracking.' },
  { id: 'sorting', name: 'Sorting', slug: 'sorting', phase: 'Phase 1: Fundamentals', display_order: 4, description: 'Custom comparators, stable sorting, counting sort, and ordering fundamentals.' },
  { id: 'searching', name: 'Searching', slug: 'searching', phase: 'Phase 1: Fundamentals', display_order: 5, description: 'Linear scans, sentinel searches, condition matching, and range queries.' },
  { id: 'binary-search', name: 'Binary Search', slug: 'binary-search', phase: 'Phase 1: Fundamentals', display_order: 6, description: 'Logarithmic search space reduction, lower/upper bounds, and monotonic predicates.' },
  { id: 'two-pointers', name: 'Two Pointers', slug: 'two-pointers', phase: 'Phase 1: Fundamentals', display_order: 7, description: 'Inward converging pointers, fast/slow pointers, and sorted pair matching.' },
  { id: 'sliding-window', name: 'Sliding Window', slug: 'sliding-window', phase: 'Phase 1: Fundamentals', display_order: 8, description: 'Fixed and dynamic window mechanics for sub-arrays and substring properties.' },
  { id: 'prefix-sum', name: 'Prefix Sum', slug: 'prefix-sum', phase: 'Phase 1: Fundamentals', display_order: 9, description: 'Cumulative arrays for instant range sum queries and pivot balance detection.' },
  { id: 'matrix', name: 'Matrix', slug: 'matrix', phase: 'Phase 1: Fundamentals', display_order: 10, description: '2D grid traversal, coordinate math, diagonal sweeps, and matrix rotations.' },

  // Phase 2 — Linear Data Structures
  { id: 'linked-lists', name: 'Linked Lists', slug: 'linked-lists', phase: 'Phase 2: Linear Data Structures', display_order: 11, description: 'Singly and doubly linked lists, dummy nodes, reversals, and cycle detection.' },
  { id: 'stack', name: 'Stack', slug: 'stack', phase: 'Phase 2: Linear Data Structures', display_order: 12, description: 'LIFO access, balanced parentheses, post-fix evaluations, and undo patterns.' },
  { id: 'queue', name: 'Queue', slug: 'queue', phase: 'Phase 2: Linear Data Structures', display_order: 13, description: 'FIFO queues, circular buffers, task queues, and pipeline staging.' },
  { id: 'deque', name: 'Deque', slug: 'deque', phase: 'Phase 2: Linear Data Structures', display_order: 14, description: 'Double-ended queue operations for front and back dynamic buffering.' },
  { id: 'recursion', name: 'Recursion', slug: 'recursion', phase: 'Phase 2: Linear Data Structures', display_order: 15, description: 'Base cases, call stack mechanics, recursive divide-and-conquer.' },
  { id: 'basic-backtracking', name: 'Basic Backtracking', slug: 'basic-backtracking', phase: 'Phase 2: Linear Data Structures', display_order: 16, description: 'Systematic state-space exploration, prune conditions, and path restoration.' },

  // Phase 3 — Trees and Heaps
  { id: 'binary-trees', name: 'Binary Trees', slug: 'binary-trees', phase: 'Phase 3: Trees and Heaps', display_order: 17, description: 'Binary tree structures, depth calculations, balance checks, and mirror trees.' },
  { id: 'binary-search-trees', name: 'Binary Search Trees', slug: 'binary-search-trees', phase: 'Phase 3: Trees and Heaps', display_order: 18, description: 'BST invariant properties, minimum differences, range searches, and validation.' },
  { id: 'tree-traversals', name: 'Tree Traversals', slug: 'tree-traversals', phase: 'Phase 3: Trees and Heaps', display_order: 19, description: 'In-order, pre-order, post-order, and level-order traversals.' },
  { id: 'heaps', name: 'Heaps', slug: 'heaps', phase: 'Phase 3: Trees and Heaps', display_order: 20, description: 'Min-heaps, max-heaps, heapify operations, and priority queues.' },
  { id: 'priority-queues', name: 'Priority Queues', slug: 'priority-queues', phase: 'Phase 3: Trees and Heaps', display_order: 21, description: 'Rank-ordered event scheduling, k-smallest streaming, and greedy selections.' },
  { id: 'tries', name: 'Tries', slug: 'tries', phase: 'Phase 3: Trees and Heaps', display_order: 22, description: 'Prefix trees, word lookups, auto-complete prefix validations.' },

  // Phase 4 — Graphs
  { id: 'graph-basics', name: 'Graph Basics', slug: 'graph-basics', phase: 'Phase 4: Graphs', display_order: 23, description: 'Adjacency lists, edge classifications, degrees, and vertex relations.' },
  { id: 'bfs', name: 'BFS', slug: 'bfs', phase: 'Phase 4: Graphs', display_order: 24, description: 'Breadth-first search, shortest path in unweighted graphs, level tracking.' },
  { id: 'dfs', name: 'DFS', slug: 'dfs', phase: 'Phase 4: Graphs', display_order: 25, description: 'Depth-first search, connected components, flood fill, and island counting.' },
  { id: 'union-find', name: 'Union Find', slug: 'union-find', phase: 'Phase 4: Graphs', display_order: 26, description: 'Disjoint set union with path compression and rank-based unions.' },
  { id: 'topological-sorting', name: 'Topological Sorting', slug: 'topological-sorting', phase: 'Phase 4: Graphs', display_order: 27, description: 'DAG dependency ordering and Kahn algorithm fundamentals.' },

  // Phase 5 — Problem-Solving Techniques
  { id: 'greedy-algorithms', name: 'Greedy Algorithms', slug: 'greedy-algorithms', phase: 'Phase 5: Problem-Solving Techniques', display_order: 28, description: 'Locally optimal choices yielding global optimums, activity selection, and change.' },
  { id: 'dynamic-programming', name: 'Dynamic Programming', slug: 'dynamic-programming', phase: 'Phase 5: Problem-Solving Techniques', display_order: 29, description: 'Overlapping subproblems, optimal substructure, 1D memoization, and tabulations.' },
  { id: 'bit-manipulation', name: 'Bit Manipulation', slug: 'bit-manipulation', phase: 'Phase 5: Problem-Solving Techniques', display_order: 30, description: 'Bitwise AND, OR, XOR, shifts, parity counting, and bitmask flags.' },
  { id: 'mathematics', name: 'Mathematics', slug: 'mathematics', phase: 'Phase 5: Problem-Solving Techniques', display_order: 31, description: 'Number theory, GCD, primes, digit extractions, and arithmetic progressions.' },
  { id: 'intervals', name: 'Intervals', slug: 'intervals', phase: 'Phase 5: Problem-Solving Techniques', display_order: 32, description: 'Interval overlap testing, merging non-overlapping bounds, and schedule checks.' },
  { id: 'monotonic-stack', name: 'Monotonic Stack', slug: 'monotonic-stack', phase: 'Phase 5: Problem-Solving Techniques', display_order: 33, description: 'Next greater/smaller elements, boundary spans, and stock span problems.' },
  { id: 'monotonic-queue', name: 'Monotonic Queue', slug: 'monotonic-queue', phase: 'Phase 5: Problem-Solving Techniques', display_order: 34, description: 'Sliding window maximums and monotonic deque properties.' },
  { id: 'divide-and-conquer', name: 'Divide and Conquer', slug: 'divide-and-conquer', phase: 'Phase 5: Problem-Solving Techniques', display_order: 35, description: 'Subproblem partitioning, recursive merges, and tree reconstruction.' },

  // Phase 6 — Additional Topics
  { id: 'simulation', name: 'Simulation', slug: 'simulation', phase: 'Phase 6: Additional Topics', display_order: 36, description: 'Direct modeling of state machines, board games, and mechanical rules.' },
  { id: 'counting', name: 'Counting', slug: 'counting', phase: 'Phase 6: Additional Topics', display_order: 37, description: 'Combinatorics, histogram counting, pigeonhole principle, and pair counts.' },
  { id: 'geometry', name: 'Geometry', slug: 'geometry', phase: 'Phase 6: Additional Topics', display_order: 38, description: 'Points, lines, slopes, Manhattan distances, and 2D bounding boxes.' },
  { id: 'enumeration', name: 'Enumeration', slug: 'enumeration', phase: 'Phase 6: Additional Topics', display_order: 39, description: 'Exhaustive search spaces, permutations, and brute-force evaluations.' },
  { id: 'database-sql', name: 'Database / SQL', slug: 'database-sql', phase: 'Phase 6: Additional Topics', display_order: 40, description: 'Relational querying, join filtering, aggregations, and subqueries.' }
];

console.log(`Configured ${topicsList.length} topics`);
