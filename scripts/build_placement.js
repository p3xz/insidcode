const fs = require('fs');
const path = require('path');
const { allMeta, generateQuestionCode, fileHeader, fileFooter } = require('./curriculum_builder_utils');

const placementSpecs = {
  281: {
    desc: "Given non-negative integer N, find the sum of all digits repeatedly until a single digit is obtained (Digital Root).",
    in: "9875", out: "2",
    tests: [{ input: "9875", output: "2" }, { input: "38", output: "2" }, { input: "0", output: "0" }]
  },
  282: {
    desc: "Check whether an integer N is an Automorphic number (square of N ends with N). Print 'Yes' or 'No'.",
    in: "25", out: "Yes",
    tests: [{ input: "25", output: "Yes" }, { input: "76", output: "Yes" }, { input: "13", output: "No" }]
  },
  283: {
    desc: "Check whether positive integer N is a Harshad (Niven) number (divisible by the sum of its digits). Print 'Yes' or 'No'.",
    in: "18", out: "Yes",
    tests: [{ input: "18", output: "Yes" }, { input: "19", output: "No" }, { input: "21", output: "Yes" }]
  },
  284: {
    desc: "Given positive integer N, calculate sum of proper divisors S. If S > N print 'Abundant', if S < N print 'Deficient', else 'Perfect'.",
    in: "12", out: "Abundant",
    tests: [{ input: "12", output: "Abundant" }, { input: "15", output: "Deficient" }, { input: "6", output: "Perfect" }]
  },
  285: {
    desc: "Check if positive integer N is a Kaprekar number (split square into two parts that sum to N). Print 'Yes' or 'No'.",
    in: "45", out: "Yes",
    tests: [{ input: "45", output: "Yes" }, { input: "9", output: "Yes" }, { input: "10", output: "No" }]
  },
  286: {
    desc: "Given range L and R on separate lines, print all Spy numbers (digit sum equals digit product) separated by space.",
    in: "1000\n1200", out: "1124 1142",
    tests: [{ input: "1000\n1200", output: "1124 1142" }, { input: "1\n20", output: "1 2 3 4 5 6 7 8 9" }]
  },
  287: {
    desc: "Given positive integer N, find the count of trailing zeros in N! without calculating the factorial directly.",
    in: "100", out: "24",
    tests: [{ input: "100", output: "24" }, { input: "5", output: "1" }, { input: "25", output: "6" }]
  },
  288: {
    desc: "Given integer N (1 <= N <= 3999), convert it into its standard Roman numeral string.",
    in: "1994", out: "MCMXCIV",
    tests: [{ input: "1994", output: "MCMXCIV" }, { input: "58", output: "LVIII" }, { input: "9", output: "IX" }]
  },
  289: {
    desc: "Given an even number N (> 2), find two prime numbers p1 and p2 (p1 <= p2) such that p1 + p2 = N. Print in format 'p1 p2'.",
    in: "10", out: "3 7",
    tests: [{ input: "10", output: "3 7" }, { input: "4", output: "2 2" }, { input: "16", output: "3 13" }]
  },
  290: {
    desc: "Given integer N (>= 2), print its prime factorization in ascending prime order separated by space (format 'p^k').",
    in: "12", out: "2^2 3^1",
    tests: [{ input: "12", output: "2^2 3^1" }, { input: "18", output: "2^1 3^2" }, { input: "13", output: "13^1" }]
  },
  291: {
    desc: "Given sorted array of N integers on line 2 and target K on line 3, find two 0-based indices that sum to K using two pointers. Print 'i j' or '-1'.",
    in: "5\n1 2 3 4 6\n6", out: "1 3",
    tests: [{ input: "5\n1 2 3 4 6\n6", output: "1 3" }, { input: "3\n2 5 9\n8", output: "-1" }]
  },
  292: {
    desc: "Given sorted array of N integers, remove duplicates in-place and print the new length followed by space and the unique elements.",
    in: "5\n1 1 2 2 3", out: "3 1 2 3",
    tests: [{ input: "5\n1 1 2 2 3", output: "3 1 2 3" }]
  },
  293: {
    desc: "Given array of N elements consisting of only 0s, 1s, and 2s, sort in single pass using Dutch National Flag algorithm.",
    in: "6\n2 0 2 1 1 0", out: "0 0 1 1 2 2",
    tests: [{ input: "6\n2 0 2 1 1 0", output: "0 0 1 1 2 2" }]
  },
  294: {
    desc: "Given N integers on line 2 and K on line 3, find maximum sum of any contiguous subarray of size K.",
    in: "6\n2 1 5 1 3 2\n3", out: "9",
    tests: [{ input: "6\n2 1 5 1 3 2\n3", output: "9" }]
  },
  295: {
    desc: "Given binary array containing 0s and 1s, find the maximum length of a contiguous subarray with an equal number of 0s and 1s.",
    in: "4\n0 1 0 1", out: "4",
    tests: [{ input: "4\n0 1 0 1", output: "4" }, { input: "2\n0 1", output: "2" }, { input: "3\n0 0 0", output: "0" }]
  },
  296: {
    desc: "Given two sorted arrays, merge them into a single sorted array in O(N+M) time without library sort.",
    in: "3\n1 3 5\n3\n2 4 6", out: "1 2 3 4 5 6",
    tests: [{ input: "3\n1 3 5\n3\n2 4 6", output: "1 2 3 4 5 6" }]
  },
  297: {
    desc: "Given two sorted arrays, find their intersection elements using two pointers and print separated by space.",
    in: "5\n1 2 2 3 4\n4\n2 2 4 6", out: "2 2 4",
    tests: [{ input: "5\n1 2 2 3 4\n4\n2 2 4 6", output: "2 2 4" }]
  },
  298: {
    desc: "Check if array of N integers can be partitioned into two contiguous segments of equal sum. Print 'Yes' or 'No'.",
    in: "4\n1 2 3 6", out: "Yes",
    tests: [{ input: "4\n1 2 3 6", output: "Yes" }, { input: "3\n1 2 4", output: "No" }]
  },
  299: {
    desc: "Given array of N non-negative integers representing elevation map, compute total trapped rainwater.",
    in: "6\n0 1 0 2 1 3", out: "2",
    tests: [{ input: "6\n0 1 0 2 1 3", output: "2" }, { input: "3\n3 0 2", output: "2" }]
  },
  300: {
    desc: "Given array with equal count of positive and negative integers, rearrange them so positive and negative numbers alternate starting with positive.",
    in: "6\n3 1 -2 -5 2 -4", out: "3 -2 1 -5 2 -4",
    tests: [{ input: "6\n3 1 -2 -5 2 -4", output: "3 -2 1 -5 2 -4" }]
  },
  301: {
    desc: "Given string S, perform Run-Length Encoding (e.g. 'aaabbc' -> 'a3b2c1').",
    in: "aaabbc", out: "a3b2c1",
    tests: [{ input: "aaabbc", output: "a3b2c1" }, { input: "abcd", output: "a1b1c1d1" }]
  },
  302: {
    desc: "Given run-length encoded string (e.g. 'a3b2c1'), decode back to original full string.",
    in: "a3b2c1", out: "aaabbc",
    tests: [{ input: "a3b2c1", output: "aaabbc" }]
  },
  303: {
    desc: "Check whether a given sentence is a Pangram (contains every letter from a to z). Print 'Yes' or 'No'.",
    in: "The quick brown fox jumps over the lazy dog", out: "Yes",
    tests: [{ input: "The quick brown fox jumps over the lazy dog", output: "Yes" }, { input: "Hello World", output: "No" }]
  },
  304: {
    desc: "Given a sentence, find the length of the longest word without using built-in split methods.",
    in: "Master algorithmic logic easily", out: "11",
    tests: [{ input: "Master algorithmic logic easily", output: "11" }, { input: "a bb ccc", output: "3" }]
  },
  305: {
    desc: "Given a sentence, count the frequency of each unique word in order of first appearance, format 'word: count'.",
    in: "apple orange apple banana orange apple", out: "apple: 3\norange: 2\nbanana: 1",
    tests: [{ input: "apple orange apple banana orange apple", output: "apple: 3\norange: 2\nbanana: 1" }]
  },
  306: {
    desc: "Given two strings S1 and S2 on separate lines, check if S1 is a subsequence of S2. Print 'Yes' or 'No'.",
    in: "abc\nahbgdc", out: "Yes",
    tests: [{ input: "abc\nahbgdc", output: "Yes" }, { input: "axc\nahbgdc", output: "No" }]
  },
  307: {
    desc: "Validate IPv4 address format strictly (4 octets 0-255 with no leading zeros). Print 'Valid' or 'Invalid'.",
    in: "172.16.254.1", out: "Valid",
    tests: [{ input: "172.16.254.1", output: "Valid" }, { input: "172.16.254.01", output: "Invalid" }]
  },
  308: {
    desc: "Given string of bracket characters, verify if parentheses (), {}, [] are properly balanced. Print 'Valid' or 'Invalid'.",
    in: "{[()]}", out: "Valid",
    tests: [{ input: "{[()]}", output: "Valid" }, { input: "{[(])}", output: "Invalid" }]
  },
  309: {
    desc: "Given string S, find first non-repeating character in a single traversal. If none, print -1.",
    in: "swiss", out: "w",
    tests: [{ input: "swiss", output: "w" }, { input: "aabb", output: "-1" }]
  },
  310: {
    desc: "Compress string by count. Return compressed string only if strictly shorter than original, else return original.",
    in: "aabcccccaaa", out: "a2b1c5a3",
    tests: [{ input: "aabcccccaaa", output: "a2b1c5a3" }, { input: "abcd", output: "abcd" }]
  },
  311: {
    desc: "Check if integer N is a power of 2 using bitwise operators. Print 'Yes' or 'No'.",
    in: "16", out: "Yes",
    tests: [{ input: "16", output: "Yes" }, { input: "18", output: "No" }, { input: "1", output: "Yes" }]
  },
  312: {
    desc: "Given non-negative integer N, count number of set bits (1s) in binary using Brian Kernighan's algorithm.",
    in: "15", out: "4",
    tests: [{ input: "15", output: "4" }, { input: "8", output: "1" }, { input: "0", output: "0" }]
  },
  313: {
    desc: "Given two integers A and B on separate lines, swap them using bitwise XOR and print in format 'A B'.",
    in: "10\n20", out: "20 10",
    tests: [{ input: "10\n20", output: "20 10" }, { input: "-5\n5", output: "5 -5" }]
  },
  314: {
    desc: "Given array of N integers where every element appears twice except one, find that single element using XOR.",
    in: "5\n4 1 2 1 2", out: "4",
    tests: [{ input: "5\n4 1 2 1 2", output: "4" }, { input: "3\n2 2 1", output: "1" }]
  },
  315: {
    desc: "Given number N on line 1 and bit position K (0-indexed) on line 2, check if K-th bit is set. Print 'Set' or 'Unset'.",
    in: "5\n0", out: "Set",
    tests: [{ input: "5\n0", output: "Set" }, { input: "5\n1", output: "Unset" }]
  },
  316: {
    desc: "Given array where all elements appear twice except two numbers, find those two numbers in ascending order separated by space.",
    in: "6\n1 2 3 2 1 4", out: "3 4",
    tests: [{ input: "6\n1 2 3 2 1 4", output: "3 4" }]
  },
  317: {
    desc: "Given unsigned 32-bit integer, reverse its binary representation and print as decimal.",
    in: "43261596", out: "964176192",
    tests: [{ input: "43261596", output: "964176192" }]
  },
  318: {
    desc: "Given integer N, print N multiplied by 2 (using << 1) and N divided by 2 (using >> 1) separated by space.",
    in: "10", out: "20 5",
    tests: [{ input: "10", output: "20 5" }, { input: "7", output: "14 3" }]
  },
  319: {
    desc: "Given integer N (1 <= N <= 10), count all binary strings of length N that do not contain consecutive 1s.",
    in: "3", out: "5",
    tests: [{ input: "3", output: "5" }, { input: "2", output: "3" }, { input: "1", output: "2" }]
  },
  320: {
    desc: "Given array of N-1 integers from range 1 to N, find the single missing number using bitwise XOR.",
    in: "4\n1 2 4", out: "3",
    tests: [{ input: "4\n1 2 4", output: "3" }, { input: "2\n1", output: "2" }]
  },
  321: {
    desc: "Given N followed by N x N matrix, find sum of both primary and secondary diagonals (if N is odd, center element counted once).",
    in: "3\n1 2 3\n4 5 6\n7 8 9", out: "25",
    tests: [{ input: "3\n1 2 3\n4 5 6\n7 8 9", output: "25" }, { input: "2\n1 1\n1 1", output: "4" }]
  },
  322: {
    desc: "Given N followed by N x N matrix, check if matrix is symmetric (A[i][j] == A[j][i]). Print 'Yes' or 'No'.",
    in: "3\n1 2 3\n2 4 5\n3 5 6", out: "Yes",
    tests: [{ input: "3\n1 2 3\n2 4 5\n3 5 6", output: "Yes" }, { input: "2\n1 2\n3 4", output: "No" }]
  },
  323: {
    desc: "Given N followed by N x N matrix, transpose in-place and print.",
    in: "2\n1 2\n3 4", out: "1 3\n2 4",
    tests: [{ input: "2\n1 2\n3 4", output: "1 3\n2 4" }]
  },
  324: {
    desc: "Given N followed by N x N matrix, rotate 90 degrees clockwise and print.",
    in: "3\n1 2 3\n4 5 6\n7 8 9", out: "7 4 1\n8 5 2\n9 6 3",
    tests: [{ input: "3\n1 2 3\n4 5 6\n7 8 9", output: "7 4 1\n8 5 2\n9 6 3" }]
  },
  325: {
    desc: "Given dimensions R and C followed by R x C matrix, print all elements in Spiral Order separated by space.",
    in: "3 3\n1 2 3\n4 5 6\n7 8 9", out: "1 2 3 6 9 8 7 4 5",
    tests: [{ input: "3 3\n1 2 3\n4 5 6\n7 8 9", output: "1 2 3 6 9 8 7 4 5" }]
  },
  326: {
    desc: "Given R and C followed by R x C matrix, print elements in Snake / Zig-Zag traversal (row 0 left-to-right, row 1 right-to-left, etc.).",
    in: "3 3\n1 2 3\n4 5 6\n7 8 9", out: "1 2 3 6 5 4 7 8 9",
    tests: [{ input: "3 3\n1 2 3\n4 5 6\n7 8 9", output: "1 2 3 6 5 4 7 8 9" }]
  },
  327: {
    desc: "Given R and C followed by boolean matrix (0s and 1s), find 0-based row index with maximum number of 1s.",
    in: "3 4\n0 1 1 1\n0 0 1 1\n1 1 1 1", out: "2",
    tests: [{ input: "3 4\n0 1 1 1\n0 0 1 1\n1 1 1 1", output: "2" }]
  },
  328: {
    desc: "Given N followed by N x N matrix, check whether it is an Identity matrix (1s on main diagonal, 0s elsewhere). Print 'Yes' or 'No'.",
    in: "3\n1 0 0\n0 1 0\n0 0 1", out: "Yes",
    tests: [{ input: "3\n1 0 0\n0 1 0\n0 0 1", output: "Yes" }, { input: "2\n1 0\n1 1", output: "No" }]
  },
  329: {
    desc: "Given R and C followed by R x C matrix, find saddle point (minimum in its row, maximum in its column). If exists print value, else '-1'.",
    in: "3 3\n1 2 3\n4 5 6\n7 8 9", out: "7",
    tests: [{ input: "3 3\n1 2 3\n4 5 6\n7 8 9", output: "7" }]
  },
  330: {
    desc: "Given R and C followed by R x C matrix sorted row-wise and column-wise, and target X on next line, check if X exists in O(M+N) time. Print 'Yes' or 'No'.",
    in: "3 3\n1 4 7\n2 5 8\n3 6 9\n5", out: "Yes",
    tests: [{ input: "3 3\n1 4 7\n2 5 8\n3 6 9\n5", output: "Yes" }, { input: "3 3\n1 4 7\n2 5 8\n3 6 9\n20", output: "No" }]
  }
};

const pieces = [];
for (let id = 281; id <= 330; id++) {
  const meta = allMeta[id];
  const spec = placementSpecs[id];
  if (!meta || !spec) {
    console.error('Missing spec for placement question', id);
    process.exit(1);
  }
  pieces.push(generateQuestionCode(meta, 6, spec.desc, spec.in, spec.out, spec.tests));
}

const outContent = fileHeader('CURRICULUM_PLACEMENT') + pieces.join(',\n\n') + fileFooter();
const targetPath = path.join(__dirname, '..', 'src', 'lib', 'curriculumDataPlacement.ts');
fs.writeFileSync(targetPath, outContent, 'utf8');
console.log(`Generated ${targetPath} with ${pieces.length} questions.`);
