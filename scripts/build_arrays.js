const fs = require('fs');
const path = require('path');
const { allMeta, generateQuestionCode, fileHeader, fileFooter } = require('./curriculum_builder_utils');

const arraySpecs = {
  81: {
    desc: "Given N followed by N space-separated integers on the next line, print them separated by space.",
    in: "4\n1 2 3 4", out: "1 2 3 4",
    tests: [{ input: "4\n1 2 3 4", output: "1 2 3 4" }, { input: "1\n99", output: "99" }, { input: "3\n5 10 15", output: "5 10 15" }]
  },
  82: {
    desc: "Given N followed by N space-separated integers, calculate and print the sum of all elements.",
    in: "5\n1 2 3 4 5", out: "15",
    tests: [{ input: "5\n1 2 3 4 5", output: "15" }, { input: "3\n-5 10 5", output: "10" }, { input: "1\n0", output: "0" }]
  },
  83: {
    desc: "Given N followed by N space-separated integers, compute the floor integer average of array elements.",
    in: "4\n2 4 6 8", out: "5",
    tests: [{ input: "4\n2 4 6 8", output: "5" }, { input: "3\n10 20 30", output: "20" }, { input: "5\n1 2 3 4 5", output: "3" }]
  },
  84: {
    desc: "Given N followed by N space-separated integers, find and print the maximum element.",
    in: "5\n3 7 2 9 5", out: "9",
    tests: [{ input: "5\n3 7 2 9 5", output: "9" }, { input: "3\n-10 -5 -20", output: "-5" }, { input: "1\n42", output: "42" }]
  },
  85: {
    desc: "Given N followed by N space-separated integers, find and print the minimum element.",
    in: "5\n3 7 2 9 5", out: "2",
    tests: [{ input: "5\n3 7 2 9 5", output: "2" }, { input: "3\n-10 -5 -20", output: "-20" }, { input: "1\n7", output: "7" }]
  },
  86: {
    desc: "Given N followed by N integers, count how many elements are positive, negative, or zero. Print in format 'Positive: P, Negative: N, Zero: Z'.",
    in: "5\n1 -2 0 4 -5", out: "Positive: 2, Negative: 2, Zero: 1",
    tests: [{ input: "5\n1 -2 0 4 -5", output: "Positive: 2, Negative: 2, Zero: 1" }, { input: "3\n0 0 0", output: "Positive: 0, Negative: 0, Zero: 3" }, { input: "2\n5 10", output: "Positive: 2, Negative: 0, Zero: 0" }]
  },
  87: {
    desc: "Given N followed by N integers, count how many elements are even and odd. Print in format 'Even: E, Odd: O'.",
    in: "5\n1 2 3 4 5", out: "Even: 2, Odd: 3",
    tests: [{ input: "5\n1 2 3 4 5", output: "Even: 2, Odd: 3" }, { input: "4\n2 4 6 8", output: "Even: 4, Odd: 0" }, { input: "3\n1 3 5", output: "Even: 0, Odd: 3" }]
  },
  88: {
    desc: "Given N followed by N integers, print the 0-based index of the first occurrence of the maximum element.",
    in: "5\n10 40 20 50 30", out: "3",
    tests: [{ input: "5\n10 40 20 50 30", output: "3" }, { input: "4\n99 10 20 99", output: "0" }, { input: "1\n5", output: "0" }]
  },
  89: {
    desc: "Given N followed by N integers, print the 0-based index of the first occurrence of the minimum element.",
    in: "5\n10 40 5 50 30", out: "2",
    tests: [{ input: "5\n10 40 5 50 30", output: "2" }, { input: "3\n-10 -20 0", output: "1" }, { input: "1\n8", output: "0" }]
  },
  90: {
    desc: "Given N followed by N integers on line 2, and an integer K on line 3, print all elements strictly greater than K separated by space.",
    in: "5\n10 25 3 40 15\n20", out: "25 40",
    tests: [{ input: "5\n10 25 3 40 15\n20", output: "25 40" }, { input: "3\n1 2 3\n5", output: "" }, { input: "4\n5 10 15 20\n0", output: "5 10 15 20" }]
  },
  91: {
    desc: "Given N followed by N integers on line 2, and target X on line 3, check if X exists in the array. Print 'Yes' or 'No'.",
    in: "5\n1 2 3 4 5\n3", out: "Yes",
    tests: [{ input: "5\n1 2 3 4 5\n3", output: "Yes" }, { input: "4\n10 20 30 40\n25", output: "No" }, { input: "1\n7\n7", output: "Yes" }]
  },
  92: {
    desc: "Given N followed by N integers on line 2, and target X on line 3, count how many times X appears.",
    in: "5\n1 2 2 3 2\n2", out: "3",
    tests: [{ input: "5\n1 2 2 3 2\n2", output: "3" }, { input: "4\n5 5 5 5\n5", output: "4" }, { input: "3\n1 2 3\n9", output: "0" }]
  },
  93: {
    desc: "Given N followed by N integers on line 2, and target X on line 3, find the 0-based index of the first occurrence of X (or -1 if not found).",
    in: "5\n10 20 30 20 50\n20", out: "1",
    tests: [{ input: "5\n10 20 30 20 50\n20", output: "1" }, { input: "3\n1 2 3\n9", output: "-1" }, { input: "4\n5 5 5 5\n5", output: "0" }]
  },
  94: {
    desc: "Given N followed by N integers on line 2, and target X on line 3, find the 0-based index of the last occurrence of X (or -1 if not found).",
    in: "5\n10 20 30 20 50\n20", out: "3",
    tests: [{ input: "5\n10 20 30 20 50\n20", output: "3" }, { input: "3\n1 2 3\n9", output: "-1" }, { input: "4\n5 5 5 5\n5", output: "3" }]
  },
  95: {
    desc: "Check whether all elements in the array are unique (no duplicates). Print 'Yes' or 'No'.",
    in: "4\n1 2 3 4", out: "Yes",
    tests: [{ input: "4\n1 2 3 4", output: "Yes" }, { input: "4\n1 2 2 3", output: "No" }, { input: "1\n99", output: "Yes" }]
  },
  96: {
    desc: "Given N followed by N integers, find and print the sum of only the even elements.",
    in: "5\n1 2 3 4 5", out: "6",
    tests: [{ input: "5\n1 2 3 4 5", output: "6" }, { input: "3\n1 3 5", output: "0" }, { input: "4\n2 4 6 8", output: "20" }]
  },
  97: {
    desc: "Given N followed by N integers, find and print the sum of only the odd elements.",
    in: "5\n1 2 3 4 5", out: "9",
    tests: [{ input: "5\n1 2 3 4 5", output: "9" }, { input: "3\n2 4 6", output: "0" }, { input: "3\n1 3 5", output: "9" }]
  },
  98: {
    desc: "Given N followed by N integers, count how many prime numbers exist in the array.",
    in: "5\n2 3 4 5 6", out: "3",
    tests: [{ input: "5\n2 3 4 5 6", output: "3" }, { input: "4\n1 4 6 8", output: "0" }, { input: "3\n7 11 13", output: "3" }]
  },
  99: {
    desc: "Given N followed by N integers, count how many numbers are divisible by both 3 and 5.",
    in: "5\n15 30 7 10 45", out: "3",
    tests: [{ input: "5\n15 30 7 10 45", output: "3" }, { input: "3\n3 5 9", output: "0" }, { input: "2\n15 30", output: "2" }]
  },
  100: {
    desc: "Given N followed by N integers, count how many numbers are perfect squares.",
    in: "5\n4 9 10 16 20", out: "3",
    tests: [{ input: "5\n4 9 10 16 20", output: "3" }, { input: "3\n2 3 5", output: "0" }, { input: "4\n1 0 25 36", output: "4" }]
  },
  101: {
    desc: "Given N followed by N integers, print the squares of each element separated by space.",
    in: "4\n1 2 3 4", out: "1 4 9 16",
    tests: [{ input: "4\n1 2 3 4", output: "1 4 9 16" }, { input: "3\n-2 0 3", output: "4 0 9" }]
  },
  102: {
    desc: "Given N followed by N integers, print only the even elements separated by space.",
    in: "5\n1 2 3 4 5", out: "2 4",
    tests: [{ input: "5\n1 2 3 4 5", output: "2 4" }, { input: "3\n1 3 5", output: "" }, { input: "3\n2 4 6", output: "2 4 6" }]
  },
  103: {
    desc: "Given N followed by N integers, replace every negative number with 0 and print the modified array separated by space.",
    in: "5\n-1 2 -3 4 0", out: "0 2 0 4 0",
    tests: [{ input: "5\n-1 2 -3 4 0", output: "0 2 0 4 0" }, { input: "3\n-5 -10 -2", output: "0 0 0" }]
  },
  104: {
    desc: "Given N followed by N integers, replace all even numbers with 1 and all odd numbers with 0, then print the array.",
    in: "5\n1 2 3 4 5", out: "0 1 0 1 0",
    tests: [{ input: "5\n1 2 3 4 5", output: "0 1 0 1 0" }, { input: "3\n2 4 6", output: "1 1 1" }]
  },
  105: {
    desc: "Given N followed by N integers, swap the first and last elements and print the resulting array.",
    in: "4\n1 2 3 4", out: "4 2 3 1",
    tests: [{ input: "4\n1 2 3 4", output: "4 2 3 1" }, { input: "2\n10 20", output: "20 10" }, { input: "1\n5", output: "5" }]
  },
  106: {
    desc: "Given N followed by N integers, reverse the array and print the elements separated by space.",
    in: "4\n1 2 3 4", out: "4 3 2 1",
    tests: [{ input: "4\n1 2 3 4", output: "4 3 2 1" }, { input: "3\n10 20 30", output: "30 20 10" }, { input: "1\n9", output: "9" }]
  },
  107: {
    desc: "Given N followed by N integers, rotate the array left by one position (first element moves to the end) and print it.",
    in: "4\n1 2 3 4", out: "2 3 4 1",
    tests: [{ input: "4\n1 2 3 4", output: "2 3 4 1" }, { input: "3\n10 20 30", output: "20 30 10" }]
  },
  108: {
    desc: "Given N followed by N integers, rotate the array right by one position (last element moves to the front) and print it.",
    in: "4\n1 2 3 4", out: "4 1 2 3",
    tests: [{ input: "4\n1 2 3 4", output: "4 1 2 3" }, { input: "3\n10 20 30", output: "30 10 20" }]
  },
  109: {
    desc: "Given N followed by N integers, swap alternate elements (1st with 2nd, 3rd with 4th, etc.) and print the array.",
    in: "4\n1 2 3 4", out: "2 1 4 3",
    tests: [{ input: "4\n1 2 3 4", output: "2 1 4 3" }, { input: "5\n1 2 3 4 5", output: "2 1 4 3 5" }]
  },
  110: {
    desc: "Given N followed by N integers, copy all elements to a new array and print them.",
    in: "3\n5 10 15", out: "5 10 15",
    tests: [{ input: "3\n5 10 15", output: "5 10 15" }, { input: "1\n42", output: "42" }]
  },
  111: {
    desc: "Given two arrays (N followed by N elements, then M followed by M elements), check if they are identical in size, elements, and order. Print 'Yes' or 'No'.",
    in: "3\n1 2 3\n3\n1 2 3", out: "Yes",
    tests: [{ input: "3\n1 2 3\n3\n1 2 3", output: "Yes" }, { input: "3\n1 2 3\n3\n1 3 2", output: "No" }, { input: "2\n1 2\n3\n1 2 3", output: "No" }]
  },
  112: {
    desc: "Given two arrays, check if they contain the exact same set of elements with identical frequencies, ignoring order. Print 'Yes' or 'No'.",
    in: "3\n1 2 3\n3\n3 1 2", out: "Yes",
    tests: [{ input: "3\n1 2 3\n3\n3 1 2", output: "Yes" }, { input: "3\n1 2 3\n3\n1 2 4", output: "No" }, { input: "2\n1 2\n2\n2 1", output: "Yes" }]
  },
  113: {
    desc: "Given two arrays (N followed by N elements, then M followed by M elements), merge them into a single sequence and print.",
    in: "3\n1 2 3\n2\n4 5", out: "1 2 3 4 5",
    tests: [{ input: "3\n1 2 3\n2\n4 5", output: "1 2 3 4 5" }, { input: "1\n10\n1\n20", output: "10 20" }]
  },
  114: {
    desc: "Given two arrays, find all distinct elements present in both arrays and print them in ascending order.",
    in: "4\n1 2 3 4\n3\n3 4 5", out: "3 4",
    tests: [{ input: "4\n1 2 3 4\n3\n3 4 5", output: "3 4" }, { input: "2\n1 2\n2\n3 4", output: "" }, { input: "3\n10 20 30\n3\n30 20 10", output: "10 20 30" }]
  },
  115: {
    desc: "Given array A followed by array B, print elements present in A but not in B (unique, in order of appearance in A).",
    in: "4\n1 2 3 4\n2\n3 4", out: "1 2",
    tests: [{ input: "4\n1 2 3 4\n2\n3 4", output: "1 2" }, { input: "3\n1 2 3\n3\n1 2 3", output: "" }, { input: "3\n5 10 15\n1\n20", output: "5 10 15" }]
  },
  116: {
    desc: "Given two arrays, count how many distinct elements are common to both arrays.",
    in: "4\n1 2 3 4\n3\n3 4 5", out: "2",
    tests: [{ input: "4\n1 2 3 4\n3\n3 4 5", output: "2" }, { input: "2\n1 2\n2\n3 4", output: "0" }]
  },
  117: {
    desc: "Given two arrays of same size N, print their element-wise sum A[i] + B[i] separated by space.",
    in: "3\n1 2 3\n3\n4 5 6", out: "5 7 9",
    tests: [{ input: "3\n1 2 3\n3\n4 5 6", output: "5 7 9" }, { input: "2\n10 20\n2\n-5 5", output: "5 25" }]
  },
  118: {
    desc: "Given two arrays of same size N, print their element-wise product A[i] * B[i] separated by space.",
    in: "3\n1 2 3\n3\n4 5 6", out: "4 10 18",
    tests: [{ input: "3\n1 2 3\n3\n4 5 6", output: "4 10 18" }, { input: "2\n2 5\n2\n3 4", output: "6 20" }]
  },
  119: {
    desc: "Given N followed by N integers, print the frequency of each element in sorted order of elements, format 'elem: count' per line.",
    in: "5\n1 2 2 3 1", out: "1: 2\n2: 2\n3: 1",
    tests: [{ input: "5\n1 2 2 3 1", output: "1: 2\n2: 2\n3: 1" }, { input: "3\n5 5 5", output: "5: 3" }]
  },
  120: {
    desc: "Given N followed by N integers, print all elements that appear more than once in ascending order separated by space.",
    in: "6\n1 2 3 2 4 1", out: "1 2",
    tests: [{ input: "6\n1 2 3 2 4 1", output: "1 2" }, { input: "4\n1 2 3 4", output: "" }, { input: "4\n9 9 9 9", output: "9" }]
  },
  121: {
    desc: "Check if the given array of integers is sorted in non-decreasing (ascending) order. Print 'Yes' or 'No'.",
    in: "4\n1 2 3 4", out: "Yes",
    tests: [{ input: "4\n1 2 3 4", output: "Yes" }, { input: "4\n1 3 2 4", output: "No" }, { input: "3\n2 2 2", output: "Yes" }]
  },
  122: {
    desc: "Check if the given array of integers is sorted in non-increasing (descending) order. Print 'Yes' or 'No'.",
    in: "4\n4 3 2 1", out: "Yes",
    tests: [{ input: "4\n4 3 2 1", output: "Yes" }, { input: "4\n4 2 3 1", output: "No" }, { input: "1\n5", output: "Yes" }]
  },
  123: {
    desc: "Given N (>= 2) followed by N integers, find the second largest distinct element. If no second largest exists, print -1.",
    in: "5\n10 20 4 45 99", out: "45",
    tests: [{ input: "5\n10 20 4 45 99", output: "45" }, { input: "3\n10 10 10", output: "-1" }, { input: "4\n5 1 5 3", output: "3" }]
  },
  124: {
    desc: "Given N (>= 2) followed by N integers, find the second smallest distinct element. If none exists, print -1.",
    in: "5\n10 20 4 45 99", out: "10",
    tests: [{ input: "5\n10 20 4 45 99", output: "10" }, { input: "3\n5 5 5", output: "-1" }, { input: "3\n1 2 3", output: "2" }]
  },
  125: {
    desc: "Given N followed by N integers, find the absolute difference between the largest and smallest element.",
    in: "5\n10 20 4 45 99", out: "95",
    tests: [{ input: "5\n10 20 4 45 99", output: "95" }, { input: "3\n5 5 5", output: "0" }, { input: "2\n-10 10", output: "20" }]
  },
  126: {
    desc: "Given N followed by N integers, find the sum of all elements excluding the maximum and minimum elements.",
    in: "5\n1 2 3 4 5", out: "9",
    tests: [{ input: "5\n1 2 3 4 5", output: "9" }, { input: "4\n10 20 30 40", output: "50" }]
  },
  127: {
    desc: "Given N followed by N integers on line 2, and integer K on line 3, count how many pairs (i < j) satisfy A[i] + A[j] = K.",
    in: "5\n1 5 7 -1 5\n6", out: "3",
    tests: [{ input: "5\n1 5 7 -1 5\n6", output: "3" }, { input: "4\n1 2 3 4\n5", output: "2" }, { input: "3\n1 1 1\n2", output: "3" }]
  },
  128: {
    desc: "Given N followed by N integers, count how many elements are strictly greater than the average of the array.",
    in: "5\n1 2 3 4 5", out: "2",
    tests: [{ input: "5\n1 2 3 4 5", output: "2" }, { input: "4\n2 2 2 2", output: "0" }, { input: "3\n10 20 60", output: "1" }]
  },
  129: {
    desc: "Given N followed by N integers, print each distinct element in order of appearance followed by its frequency in format 'elem: count'.",
    in: "5\n1 2 2 3 3", out: "1: 1\n2: 2\n3: 2",
    tests: [{ input: "5\n1 2 2 3 3", output: "1: 1\n2: 2\n3: 2" }, { input: "4\n7 7 8 7", output: "7: 3\n8: 1" }]
  },
  130: {
    desc: "Given N followed by N integers, print all unique elements (occurring exactly once) in ascending order separated by space.",
    in: "5\n1 2 2 3 4", out: "1 3 4",
    tests: [{ input: "5\n1 2 2 3 4", output: "1 3 4" }, { input: "4\n5 5 6 6", output: "" }, { input: "3\n9 8 7", output: "7 8 9" }]
  }
};

const pieces = [];
for (let id = 81; id <= 130; id++) {
  const meta = allMeta[id];
  const spec = arraySpecs[id];
  if (!meta || !spec) {
    console.error('Missing spec for array question', id);
    process.exit(1);
  }
  pieces.push(generateQuestionCode(meta, 4, spec.desc, spec.in, spec.out, spec.tests));
}

const outContent = fileHeader('CURRICULUM_ARRAYS') + pieces.join(',\n\n') + fileFooter();
const targetPath = path.join(__dirname, '..', 'src', 'lib', 'curriculumDataArrays.ts');
fs.writeFileSync(targetPath, outContent, 'utf8');
console.log(`Generated ${targetPath} with ${pieces.length} questions.`);
