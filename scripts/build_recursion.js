const fs = require('fs');
const path = require('path');
const { allMeta, generateQuestionCode, fileHeader, fileFooter } = require('./curriculum_builder_utils');

const recursionSpecs = {
  181: {
    desc: "Given positive integer N, print numbers from 1 to N separated by space using recursion.",
    in: "5", out: "1 2 3 4 5",
    tests: [{ input: "5", output: "1 2 3 4 5" }, { input: "1", output: "1" }, { input: "3", output: "1 2 3" }]
  },
  182: {
    desc: "Given positive integer N, print numbers from N down to 1 separated by space using recursion.",
    in: "5", out: "5 4 3 2 1",
    tests: [{ input: "5", output: "5 4 3 2 1" }, { input: "1", output: "1" }]
  },
  183: {
    desc: "Given positive integer N, print all even numbers from 1 to N separated by space using recursion.",
    in: "10", out: "2 4 6 8 10",
    tests: [{ input: "10", output: "2 4 6 8 10" }, { input: "5", output: "2 4" }]
  },
  184: {
    desc: "Given positive integer N, print all odd numbers from 1 to N separated by space using recursion.",
    in: "10", out: "1 3 5 7 9",
    tests: [{ input: "10", output: "1 3 5 7 9" }, { input: "6", output: "1 3 5" }]
  },
  185: {
    desc: "Given positive integer N, calculate the sum of numbers from 1 to N using recursion.",
    in: "5", out: "15",
    tests: [{ input: "5", output: "15" }, { input: "10", output: "55" }, { input: "1", output: "1" }]
  },
  186: {
    desc: "Given integer N (0 <= N <= 12), calculate N! using recursion.",
    in: "5", out: "120",
    tests: [{ input: "5", output: "120" }, { input: "0", output: "1" }, { input: "6", output: "720" }]
  },
  187: {
    desc: "Given base X and exponent N (non-negative) on separate lines, compute X^N recursively.",
    in: "2\n5", out: "32",
    tests: [{ input: "2\n5", output: "32" }, { input: "3\n3", output: "27" }, { input: "5\n0", output: "1" }]
  },
  188: {
    desc: "Given N (0-indexed: F(0)=0, F(1)=1), find the N-th Fibonacci number recursively.",
    in: "6", out: "8",
    tests: [{ input: "6", output: "8" }, { input: "0", output: "0" }, { input: "1", output: "1" }, { input: "7", output: "13" }]
  },
  189: {
    desc: "Given positive integer N, print first N terms of Fibonacci sequence separated by space using recursion.",
    in: "6", out: "0 1 1 2 3 5",
    tests: [{ input: "6", output: "0 1 1 2 3 5" }, { input: "1", output: "0" }]
  },
  190: {
    desc: "Given positive integer N, compute the sum of its digits recursively.",
    in: "1234", out: "10",
    tests: [{ input: "1234", output: "10" }, { input: "9", output: "9" }, { input: "999", output: "27" }]
  },
  191: {
    desc: "Given non-negative integer N, count its total number of digits recursively.",
    in: "12345", out: "5",
    tests: [{ input: "12345", output: "5" }, { input: "0", output: "1" }, { input: "7", output: "1" }]
  },
  192: {
    desc: "Given positive integer N, reverse its digits recursively without leading zeros.",
    in: "1234", out: "4321",
    tests: [{ input: "1234", output: "4321" }, { input: "100", output: "1" }]
  },
  193: {
    desc: "Check whether a given positive integer N is a palindrome recursively. Print 'Yes' or 'No'.",
    in: "121", out: "Yes",
    tests: [{ input: "121", output: "Yes" }, { input: "123", output: "No" }, { input: "7", output: "Yes" }]
  },
  194: {
    desc: "Given positive integer N, compute the product of its digits recursively.",
    in: "234", out: "24",
    tests: [{ input: "234", output: "24" }, { input: "105", output: "0" }]
  },
  195: {
    desc: "Given two positive integers A and B on separate lines, compute their GCD using Euclid's recursive algorithm.",
    in: "48\n18", out: "6",
    tests: [{ input: "48\n18", output: "6" }, { input: "7\n13", output: "1" }]
  },
  196: {
    desc: "Given positive integer N, print its binary representation recursively.",
    in: "10", out: "1010",
    tests: [{ input: "10", output: "1010" }, { input: "7", output: "111" }, { input: "1", output: "1" }]
  },
  197: {
    desc: "Given positive integer N, print its digits in words separated by space recursively (e.g., 123 -> 'one two three').",
    in: "123", out: "one two three",
    tests: [{ input: "123", output: "one two three" }, { input: "50", output: "five zero" }]
  },
  198: {
    desc: "Given N, calculate the sum of the first N even positive numbers (2 + 4 + ... + 2N) recursively.",
    in: "4", out: "20",
    tests: [{ input: "4", output: "20" }, { input: "1", output: "2" }]
  },
  199: {
    desc: "Given N, calculate the sum of the first N odd positive numbers (1 + 3 + ... + 2N-1) recursively.",
    in: "4", out: "16",
    tests: [{ input: "4", output: "16" }, { input: "1", output: "1" }]
  },
  200: {
    desc: "Given N and R (0 <= R <= N) on separate lines, compute combination nCr using Pascal's recursive relation nCr = (n-1)C(r-1) + (n-1)Cr.",
    in: "5\n2", out: "10",
    tests: [{ input: "5\n2", output: "10" }, { input: "4\n0", output: "1" }, { input: "4\n4", output: "1" }]
  },
  201: {
    desc: "Given N, print a line of N asterisks '*' recursively.",
    in: "5", out: "*****",
    tests: [{ input: "5", output: "*****" }, { input: "1", output: "*" }]
  },
  202: {
    desc: "Given N, print an N x N square of asterisks '*' using recursion.",
    in: "3", out: "***\n***\n***",
    tests: [{ input: "3", output: "***\n***\n***" }, { input: "1", output: "*" }]
  },
  203: {
    desc: "Given N, print a top-down right-angled triangle of stars (row 1 has 1 star, row N has N stars) recursively.",
    in: "3", out: "*\n**\n***",
    tests: [{ input: "3", output: "*\n**\n***" }, { input: "1", output: "*" }]
  },
  204: {
    desc: "Given N, print an inverted right-angled triangle of stars (row 1 has N stars, row N has 1 star) recursively.",
    in: "3", out: "***\n**\n*",
    tests: [{ input: "3", output: "***\n**\n*" }, { input: "1", output: "*" }]
  },
  205: {
    desc: "Given N, print number triangle where row i contains 1 to i space-separated recursively.",
    in: "3", out: "1\n1 2\n1 2 3",
    tests: [{ input: "3", output: "1\n1 2\n1 2 3" }, { input: "1", output: "1" }]
  },
  206: {
    desc: "Given N, print reverse number triangle where row 1 has 1 to N, row 2 has 1 to N-1, etc. recursively.",
    in: "3", out: "1 2 3\n1 2\n1",
    tests: [{ input: "3", output: "1 2 3\n1 2\n1" }, { input: "1", output: "1" }]
  },
  207: {
    desc: "Given N, print the multiplication table of N from 1 to 10 in format 'N x i = R' recursively.",
    in: "5", out: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50",
    tests: [{ input: "5", output: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50" }]
  },
  208: {
    desc: "Given N, print numbers from 1 to N and then back down to 1 in a single recursive traversal.",
    in: "3", out: "1 2 3 2 1",
    tests: [{ input: "3", output: "1 2 3 2 1" }, { input: "1", output: "1 1" }]
  },
  209: {
    desc: "Given N, calculate sum 1 to N and print running prefix sums on each recursive step.",
    in: "3", out: "1\n3\n6",
    tests: [{ input: "3", output: "1\n3\n6" }, { input: "1", output: "1" }]
  },
  210: {
    desc: "Given N (1 <= N <= 26), print character triangle (row 1 'A', row 2 'AB', row N 'ABC...') recursively.",
    in: "3", out: "A\nAB\nABC",
    tests: [{ input: "3", output: "A\nAB\nABC" }, { input: "1", output: "A" }]
  },
  211: {
    desc: "Given string S, reverse it recursively without using loops.",
    in: "hello", out: "olleh",
    tests: [{ input: "hello", output: "olleh" }, { input: "recursion", output: "noisrucer" }]
  },
  212: {
    desc: "Given string S, check if it is a palindrome using recursion. Print 'Yes' or 'No'.",
    in: "racecar", out: "Yes",
    tests: [{ input: "racecar", output: "Yes" }, { input: "code", output: "No" }]
  },
  213: {
    desc: "Given string S, count its total vowels recursively.",
    in: "insidcode", out: "4",
    tests: [{ input: "insidcode", output: "4" }, { input: "xyz", output: "0" }]
  },
  214: {
    desc: "Given string S, remove all spaces recursively.",
    in: "hello world", out: "helloworld",
    tests: [{ input: "hello world", output: "helloworld" }]
  },
  215: {
    desc: "Given string S, target char C1, and replacement char C2 on separate lines, replace all C1 with C2 recursively.",
    in: "banana\na\nx", out: "bxnxnx",
    tests: [{ input: "banana\na\nx", output: "bxnxnx" }]
  },
  216: {
    desc: "Given string S and char C on separate lines, remove all occurrences of C recursively.",
    in: "banana\na", out: "bnn",
    tests: [{ input: "banana\na", output: "bnn" }]
  },
  217: {
    desc: "Given string S, print each character on a new line using recursion.",
    in: "code", out: "c\no\nd\ne",
    tests: [{ input: "code", output: "c\no\nd\ne" }]
  },
  218: {
    desc: "Given string S, print its characters in reverse order on a single line separated by space recursively.",
    in: "code", out: "e d o c",
    tests: [{ input: "code", output: "e d o c" }]
  },
  219: {
    desc: "Given string S, convert it to uppercase recursively.",
    in: "hello", out: "HELLO",
    tests: [{ input: "hello", output: "HELLO" }]
  },
  220: {
    desc: "Given string S, count consonants and vowels recursively. Print in format 'Vowels: V, Consonants: C'.",
    in: "apple", out: "Vowels: 2, Consonants: 3",
    tests: [{ input: "apple", output: "Vowels: 2, Consonants: 3" }, { input: "sky", output: "Vowels: 0, Consonants: 3" }]
  }
};

const pieces = [];
for (let id = 181; id <= 220; id++) {
  const meta = allMeta[id];
  const spec = recursionSpecs[id];
  if (!meta || !spec) {
    console.error('Missing spec for recursion question', id);
    process.exit(1);
  }
  pieces.push(generateQuestionCode(meta, 3, spec.desc, spec.in, spec.out, spec.tests));
}

const outContent = fileHeader('CURRICULUM_RECURSION') + pieces.join(',\n\n') + fileFooter();
const targetPath = path.join(__dirname, '..', 'src', 'lib', 'curriculumDataRecursion.ts');
fs.writeFileSync(targetPath, outContent, 'utf8');
console.log(`Generated ${targetPath} with ${pieces.length} questions.`);
