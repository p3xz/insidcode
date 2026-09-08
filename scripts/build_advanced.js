const fs = require('fs');
const path = require('path');
const { allMeta, generateQuestionCode, fileHeader, fileFooter } = require('./curriculum_builder_utils');

// Helper to auto-generate meaningful spec if not individually overridden
function makeSpec(id, title) {
  // We can write targeted high quality specs for 221-280
  return null;
}

const advancedSpecs = {
  221: {
    desc: "Print all numbers between 1 and 100 inclusive whose sum of digits is an even number, separated by space.",
    in: "", out: "2 4 6 8 11 13 15 17 19 20 22 24 26 28 31 33 35 37 39 40 42 44 46 48 51 53 55 57 59 60 62 64 66 68 71 73 75 77 79 80 82 84 86 88 91 93 95 97 99",
    tests: [{ input: "", output: "2 4 6 8 11 13 15 17 19 20 22 24 26 28 31 33 35 37 39 40 42 44 46 48 51 53 55 57 59 60 62 64 66 68 71 73 75 77 79 80 82 84 86 88 91 93 95 97 99" }]
  },
  222: {
    desc: "Count how many numbers between 1 and 500 are divisible by 7 but not by 5.",
    in: "", out: "57",
    tests: [{ input: "", output: "57" }]
  },
  223: {
    desc: "Print all numbers between 1 and 100 that are palindromes, separated by space.",
    in: "", out: "1 2 3 4 5 6 7 8 9 11 22 33 44 55 66 77 88 99",
    tests: [{ input: "", output: "1 2 3 4 5 6 7 8 9 11 22 33 44 55 66 77 88 99" }]
  },
  224: {
    desc: "Print all numbers between 1 and 50 whose digits add up to a multiple of 3, separated by space.",
    in: "", out: "3 6 9 12 15 18 21 24 27 30 33 36 39 42 45 48",
    tests: [{ input: "", output: "3 6 9 12 15 18 21 24 27 30 33 36 39 42 45 48" }]
  },
  225: {
    desc: "Given a positive integer N, find the smallest and largest digit in format 'Smallest: S, Largest: L'.",
    in: "49205", out: "Smallest: 0, Largest: 9",
    tests: [{ input: "49205", output: "Smallest: 0, Largest: 9" }, { input: "777", output: "Smallest: 7, Largest: 7" }]
  },
  226: {
    desc: "Given N, print all numbers from 1 to N whose binary representation has an even number of set bits (1s), separated by space.",
    in: "10", out: "3 5 6 9 10",
    tests: [{ input: "10", output: "3 5 6 9 10" }, { input: "5", output: "3 5" }]
  },
  227: {
    desc: "Given N, print N rows where row i (1-indexed) prints i*i.",
    in: "4", out: "1\n4\n9\n16",
    tests: [{ input: "4", output: "1\n4\n9\n16" }, { input: "2", output: "1\n4" }]
  },
  228: {
    desc: "Given N (>= 2), print a hollow square of size N x N made of asterisks '*'.",
    in: "4", out: "****\n*  *\n*  *\n****",
    tests: [{ input: "4", output: "****\n*  *\n*  *\n****" }, { input: "3", output: "***\n* *\n***" }]
  },
  229: {
    desc: "Given N (1 <= N <= 10), print first N rows of Pascal's triangle with space-separated numbers.",
    in: "4", out: "1\n1 1\n1 2 1\n1 3 3 1",
    tests: [{ input: "4", output: "1\n1 1\n1 2 1\n1 3 3 1" }, { input: "1", output: "1" }]
  },
  230: {
    desc: "Given N, print Floyd's triangle with consecutive numbers up to N rows.",
    in: "3", out: "1\n2 3\n4 5 6",
    tests: [{ input: "3", output: "1\n2 3\n4 5 6" }, { input: "2", output: "1\n2 3" }]
  },
  231: {
    desc: "Given N, print Butterfly star pattern of 2N rows.",
    in: "3", out: "*    *\n**  **\n******\n******\n**  **\n*    *",
    tests: [{ input: "3", output: "*    *\n**  **\n******\n******\n**  **\n*    *" }]
  },
  232: {
    desc: "Given N, print Diamond pattern of stars with width 2N-1.",
    in: "3", out: "  *\n ***\n*****\n ***\n  *",
    tests: [{ input: "3", output: "  *\n ***\n*****\n ***\n  *" }]
  },
  233: {
    desc: "Given N, print Hourglass pattern of stars.",
    in: "3", out: "*****\n ***\n  *\n ***\n*****",
    tests: [{ input: "3", output: "*****\n ***\n  *\n ***\n*****" }]
  },
  234: {
    desc: "Given N, print spiral matrix of numbers 1 to N^2 of size N x N.",
    in: "3", out: "1 2 3\n8 9 4\n7 6 5",
    tests: [{ input: "3", output: "1 2 3\n8 9 4\n7 6 5" }]
  },
  235: {
    desc: "Given N, print an N x N grid with zigzag (snake) row traversal numbering.",
    in: "3", out: "1 2 3\n6 5 4\n7 8 9",
    tests: [{ input: "3", output: "1 2 3\n6 5 4\n7 8 9" }]
  },
  236: {
    desc: "Given N, print an N x N checkerboard alternating between 0 and 1 starting with 0 at (0,0).",
    in: "3", out: "0 1 0\n1 0 1\n0 1 0",
    tests: [{ input: "3", output: "0 1 0\n1 0 1\n0 1 0" }]
  },
  237: {
    desc: "Given N, print inverted pyramid of stars with N rows.",
    in: "3", out: "*****\n ***\n  *",
    tests: [{ input: "3", output: "*****\n ***\n  *" }]
  },
  238: {
    desc: "Given N, print a rhombus pattern of stars of size N.",
    in: "3", out: "  ***\n ***\n***",
    tests: [{ input: "3", output: "  ***\n ***\n***" }]
  },
  239: {
    desc: "Given odd integer N, print an X cross pattern of stars in an N x N grid.",
    in: "5", out: "*   *\n * *\n  *\n * *\n*   *",
    tests: [{ input: "5", output: "*   *\n * *\n  *\n * *\n*   *" }, { input: "3", output: "* *\n *\n* *" }]
  },
  240: {
    desc: "Given N, print concentric square pattern of numbers of size (2N-1) x (2N-1).",
    in: "2", out: "2 2 2\n2 1 2\n2 2 2",
    tests: [{ input: "2", output: "2 2 2\n2 1 2\n2 2 2" }]
  },
  241: {
    desc: "Given dimensions R and C on line 1 followed by R rows of C space-separated integers, print the matrix.",
    in: "2 3\n1 2 3\n4 5 6", out: "1 2 3\n4 5 6",
    tests: [{ input: "2 3\n1 2 3\n4 5 6", output: "1 2 3\n4 5 6" }]
  },
  242: {
    desc: "Given R and C followed by an R x C matrix, calculate the sum of all elements.",
    in: "2 2\n1 2\n3 4", out: "10",
    tests: [{ input: "2 2\n1 2\n3 4", output: "10" }]
  },
  243: {
    desc: "Given R and C followed by an R x C matrix, find the 0-based index of the row with the maximum sum.",
    in: "3 2\n1 2\n5 6\n3 1", out: "1",
    tests: [{ input: "3 2\n1 2\n5 6\n3 1", output: "1" }]
  },
  244: {
    desc: "Given R and C followed by an R x C matrix, find the 0-based index of the column with the maximum sum.",
    in: "2 3\n1 5 2\n3 2 4", out: "1",
    tests: [{ input: "2 3\n1 5 2\n3 2 4", output: "1" }]
  },
  245: {
    desc: "Given R and C followed by an R x C matrix, print its transpose (size C x R).",
    in: "2 3\n1 2 3\n4 5 6", out: "1 4\n2 5\n3 6",
    tests: [{ input: "2 3\n1 2 3\n4 5 6", output: "1 4\n2 5\n3 6" }]
  },
  246: {
    desc: "Given N followed by an N x N matrix, check if it is symmetric (A[i][j] == A[j][i]). Print 'Yes' or 'No'.",
    in: "2\n1 2\n2 1", out: "Yes",
    tests: [{ input: "2\n1 2\n2 1", output: "Yes" }, { input: "2\n1 2\n3 4", output: "No" }]
  },
  247: {
    desc: "Given N followed by an N x N matrix, print sum of primary diagonal and sum of secondary diagonal in format 'Primary: P, Secondary: S'.",
    in: "3\n1 2 3\n4 5 6\n7 8 9", out: "Primary: 15, Secondary: 15",
    tests: [{ input: "3\n1 2 3\n4 5 6\n7 8 9", output: "Primary: 15, Secondary: 15" }]
  },
  248: {
    desc: "Given N followed by an N x N matrix, rotate it 90 degrees clockwise and print.",
    in: "2\n1 2\n3 4", out: "3 1\n4 2",
    tests: [{ input: "2\n1 2\n3 4", output: "3 1\n4 2" }]
  },
  249: {
    desc: "Given matrix A (N x M) and matrix B (M x P), compute their matrix product A x B.",
    in: "2 2\n1 2\n3 4\n2 2\n1 0\n0 1", out: "1 2\n3 4",
    tests: [{ input: "2 2\n1 2\n3 4\n2 2\n1 0\n0 1", output: "1 2\n3 4" }]
  },
  250: {
    desc: "Given R and C followed by an R x C matrix, print its boundary elements in clockwise order starting from (0,0) separated by space.",
    in: "3 3\n1 2 3\n4 5 6\n7 8 9", out: "1 2 3 6 9 8 7 4",
    tests: [{ input: "3 3\n1 2 3\n4 5 6\n7 8 9", output: "1 2 3 6 9 8 7 4" }]
  },
  251: {
    desc: "Given N followed by N integers, sort the array using Bubble Sort and print.",
    in: "5\n5 1 4 2 8", out: "1 2 4 5 8",
    tests: [{ input: "5\n5 1 4 2 8", output: "1 2 4 5 8" }]
  },
  252: {
    desc: "Given N followed by N integers, sort the array using Selection Sort and print.",
    in: "5\n64 25 12 22 11", out: "11 12 22 25 64",
    tests: [{ input: "5\n64 25 12 22 11", output: "11 12 22 25 64" }]
  },
  253: {
    desc: "Given N followed by N integers, sort the array using Insertion Sort and print.",
    in: "5\n12 11 13 5 6", out: "5 6 11 12 13",
    tests: [{ input: "5\n12 11 13 5 6", output: "5 6 11 12 13" }]
  },
  254: {
    desc: "Given N followed by N integers containing only 0, 1, and 2, sort them in-place (Dutch National Flag problem).",
    in: "6\n2 0 2 1 1 0", out: "0 0 1 1 2 2",
    tests: [{ input: "6\n2 0 2 1 1 0", output: "0 0 1 1 2 2" }]
  },
  255: {
    desc: "Given sorted array of N integers and target K, find two 0-based indices whose elements sum to K. If found print 'i j', else '-1'.",
    in: "5\n1 2 3 4 6\n6", out: "1 3",
    tests: [{ input: "5\n1 2 3 4 6\n6", output: "1 3" }, { input: "3\n1 2 3\n10", output: "-1" }]
  },
  256: {
    desc: "Given sorted array of N integers, remove duplicates in-place and print the unique elements separated by space.",
    in: "6\n1 1 2 2 3 4", out: "1 2 3 4",
    tests: [{ input: "6\n1 1 2 2 3 4", output: "1 2 3 4" }]
  },
  257: {
    desc: "Given N integers, move all zeroes to the end while maintaining relative order of non-zero elements.",
    in: "6\n0 1 0 3 12 0", out: "1 3 12 0 0 0",
    tests: [{ input: "6\n0 1 0 3 12 0", output: "1 3 12 0 0 0" }]
  },
  258: {
    desc: "Given two sorted arrays, find their intersection (common elements appearing in both) and print separated by space.",
    in: "5\n1 2 3 4 5\n4\n2 4 6 8", out: "2 4",
    tests: [{ input: "5\n1 2 3 4 5\n4\n2 4 6 8", output: "2 4" }]
  },
  259: {
    desc: "Given two sorted arrays, merge them into a single sorted array in O(N+M) time.",
    in: "3\n1 3 5\n3\n2 4 6", out: "1 2 3 4 5 6",
    tests: [{ input: "3\n1 3 5\n3\n2 4 6", output: "1 2 3 4 5 6" }]
  },
  260: {
    desc: "Given array of N integers, check if there exists a triplet (a, b, c) such that a + b + c = 0. Print 'Yes' or 'No'.",
    in: "5\n-1 0 1 2 -1", out: "Yes",
    tests: [{ input: "5\n-1 0 1 2 -1", output: "Yes" }, { input: "3\n1 2 3", output: "No" }]
  },
  261: {
    desc: "Given N followed by N integers on line 2, and window size K on line 3, find the maximum sum among all contiguous subarrays of size K.",
    in: "6\n2 1 5 1 3 2\n3", out: "9",
    tests: [{ input: "6\n2 1 5 1 3 2\n3", output: "9" }]
  },
  262: {
    desc: "Given N followed by N integers, find the maximum contiguous subarray sum (Kadane's algorithm).",
    in: "8\n-2 -3 4 -1 -2 1 5 -3", out: "7",
    tests: [{ input: "8\n-2 -3 4 -1 -2 1 5 -3", output: "7" }]
  },
  263: {
    desc: "Given N positive integers on line 2 and target S on line 3, find the minimal length of a contiguous subarray of which the sum >= S. If none exists, print 0.",
    in: "6\n2 3 1 2 4 3\n7", out: "2",
    tests: [{ input: "6\n2 3 1 2 4 3\n7", output: "2" }]
  },
  264: {
    desc: "Given N integers on line 2 and target K on line 3, count the total number of continuous subarrays whose sum equals K.",
    in: "3\n1 1 1\n2", out: "2",
    tests: [{ input: "3\n1 1 1\n2", output: "2" }]
  },
  265: {
    desc: "Given string S, find the length of the longest substring without repeating characters.",
    in: "abcabcbb", out: "3",
    tests: [{ input: "abcabcbb", output: "3" }, { input: "bbbbb", output: "1" }]
  },
  266: {
    desc: "Given string S on line 1 and integer K on line 2, find the length of the longest substring containing at most K distinct characters.",
    in: "eceba\n2", out: "3",
    tests: [{ input: "eceba\n2", output: "3" }]
  },
  267: {
    desc: "Given binary array of N elements (0s and 1s), find maximum consecutive 1s after flipping at most one 0.",
    in: "5\n1 0 1 1 0", out: "4",
    tests: [{ input: "5\n1 0 1 1 0", output: "4" }]
  },
  268: {
    desc: "Given N integers, find the contiguous subarray within the array which has the largest product.",
    in: "4\n2 3 -2 4", out: "6",
    tests: [{ input: "4\n2 3 -2 4", output: "6" }]
  },
  269: {
    desc: "Given N integers on line 2 and target S on line 3, find 1-based start and end indices of first contiguous subarray summing to S. If none, print -1.",
    in: "5\n1 2 3 7 5\n12", out: "2 4",
    tests: [{ input: "5\n1 2 3 7 5\n12", output: "2 4" }]
  },
  270: {
    desc: "Given N integers on line 2 and window size K on line 3, print maximum element for each sliding window of size K separated by space.",
    in: "8\n1 3 -1 -3 5 3 6 7\n3", out: "3 3 5 5 6 7",
    tests: [{ input: "8\n1 3 -1 -3 5 3 6 7\n3", output: "3 3 5 5 6 7" }]
  },
  271: {
    desc: "Validate whether a given string is a valid IPv4 address. Print 'Valid' or 'Invalid'.",
    in: "192.168.1.1", out: "Valid",
    tests: [{ input: "192.168.1.1", output: "Valid" }, { input: "256.100.0.1", output: "Invalid" }]
  },
  272: {
    desc: "Given two strings S1 and S2 on separate lines, check if they are anagrams. Print 'Yes' or 'No'.",
    in: "listen\nsilent", out: "Yes",
    tests: [{ input: "listen\nsilent", output: "Yes" }, { input: "hello\nworld", output: "No" }]
  },
  273: {
    desc: "Given N words on line 2, count how many distinct anagram groups exist.",
    in: "6\neat tea tan ate nat bat", out: "3",
    tests: [{ input: "6\neat tea tan ate nat bat", output: "3" }]
  },
  274: {
    desc: "Given N strings, find their longest common prefix. If no common prefix exists, print an empty string.",
    in: "3\nflower flow flight", out: "fl",
    tests: [{ input: "3\nflower flow flight", output: "fl" }, { input: "3\ndog racecar car", output: "" }]
  },
  275: {
    desc: "Perform basic run-length string compression (e.g., 'aabcccccaaa' -> 'a2b1c5a3').",
    in: "aabcccccaaa", out: "a2b1c5a3",
    tests: [{ input: "aabcccccaaa", output: "a2b1c5a3" }, { input: "abcd", output: "a1b1c1d1" }]
  },
  276: {
    desc: "Given string containing characters '(', ')', '{', '}', '[' and ']', check if the brackets are valid and balanced. Print 'Valid' or 'Invalid'.",
    in: "()[]{}", out: "Valid",
    tests: [{ input: "()[]{}", output: "Valid" }, { input: "(]", output: "Invalid" }]
  },
  277: {
    desc: "Given string S, find the first non-repeating character. If none exists, print -1.",
    in: "leetcode", out: "l",
    tests: [{ input: "leetcode", output: "l" }, { input: "aabb", output: "-1" }]
  },
  278: {
    desc: "Given string S, find and print the longest palindromic substring.",
    in: "babad", out: "bab",
    tests: [{ input: "babad", output: "bab" }, { input: "cbbd", output: "bb" }]
  },
  279: {
    desc: "Given N (1 <= N <= 10), print the Nth term of the Count and Say sequence.",
    in: "4", out: "1211",
    tests: [{ input: "4", output: "1211" }, { input: "1", output: "1" }]
  },
  280: {
    desc: "Given a Roman numeral string, convert it to an integer.",
    in: "MCMXCIV", out: "1994",
    tests: [{ input: "MCMXCIV", output: "1994" }, { input: "LVIII", output: "58" }]
  }
};

const pieces = [];
for (let id = 221; id <= 280; id++) {
  const meta = allMeta[id];
  const spec = advancedSpecs[id];
  if (!meta || !spec) {
    console.error('Missing spec for advanced question', id);
    process.exit(1);
  }
  pieces.push(generateQuestionCode(meta, 6, spec.desc, spec.in, spec.out, spec.tests));
}

const outContent = fileHeader('CURRICULUM_ADVANCED') + pieces.join(',\n\n') + fileFooter();
const targetPath = path.join(__dirname, '..', 'src', 'lib', 'curriculumDataAdvanced.ts');
fs.writeFileSync(targetPath, outContent, 'utf8');
console.log(`Generated ${targetPath} with ${pieces.length} questions.`);
