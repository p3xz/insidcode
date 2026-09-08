import { QuestionSeedItem, createSeedQuestion } from "./curriculumData";

export const CURRICULUM_RECURSION: QuestionSeedItem[] = [
  createSeedQuestion(181, "Print numbers from 1 to n using recursion.", 3, "Medium", "Given positive integer N, print numbers from 1 to N separated by space using recursion.", "5", "1 2 3 4 5", [
    { input: "5", expectedOutput: "1 2 3 4 5" },
    { input: "1", expectedOutput: "1" },
    { input: "3", expectedOutput: "1 2 3" }
  ]),

  createSeedQuestion(182, "Print numbers from n down to 1 using recursion.", 3, "Medium", "Given positive integer N, print numbers from N down to 1 separated by space using recursion.", "5", "5 4 3 2 1", [
    { input: "5", expectedOutput: "5 4 3 2 1" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(183, "Print only even numbers from 1 to n recursively.", 3, "Medium", "Given positive integer N, print all even numbers from 1 to N separated by space using recursion.", "10", "2 4 6 8 10", [
    { input: "10", expectedOutput: "2 4 6 8 10" },
    { input: "5", expectedOutput: "2 4" }
  ]),

  createSeedQuestion(184, "Print only odd numbers from 1 to n recursively.", 3, "Medium", "Given positive integer N, print all odd numbers from 1 to N separated by space using recursion.", "10", "1 3 5 7 9", [
    { input: "10", expectedOutput: "1 3 5 7 9" },
    { input: "6", expectedOutput: "1 3 5" }
  ]),

  createSeedQuestion(185, "Print sum of first n natural numbers recursively.", 3, "Medium", "Given positive integer N, calculate the sum of numbers from 1 to N using recursion.", "5", "15", [
    { input: "5", expectedOutput: "15" },
    { input: "10", expectedOutput: "55" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(186, "Print factorial of a number recursively.", 3, "Medium", "Given integer N (0 <= N <= 12), calculate N! using recursion.", "5", "120", [
    { input: "5", expectedOutput: "120" },
    { input: "0", expectedOutput: "1" },
    { input: "6", expectedOutput: "720" }
  ]),

  createSeedQuestion(187, "Calculate power of a number (xⁿ) using recursion.", 3, "Medium", "Given base X and exponent N (non-negative) on separate lines, compute X^N recursively.", "2\n5", "32", [
    { input: "2\n5", expectedOutput: "32" },
    { input: "3\n3", expectedOutput: "27" },
    { input: "5\n0", expectedOutput: "1" }
  ]),

  createSeedQuestion(188, "Find nth Fibonacci number recursively.", 3, "Hard", "Given N (0-indexed: F(0)=0, F(1)=1), find the N-th Fibonacci number recursively.", "6", "8", [
    { input: "6", expectedOutput: "8" },
    { input: "0", expectedOutput: "0" },
    { input: "1", expectedOutput: "1" },
    { input: "7", expectedOutput: "13" }
  ]),

  createSeedQuestion(189, "Print Fibonacci series up to n terms recursively.", 3, "Hard", "Given positive integer N, print first N terms of Fibonacci sequence separated by space using recursion.", "6", "0 1 1 2 3 5", [
    { input: "6", expectedOutput: "0 1 1 2 3 5" },
    { input: "1", expectedOutput: "0" }
  ]),

  createSeedQuestion(190, "Find sum of digits of a number recursively.", 3, "Medium", "Given positive integer N, compute the sum of its digits recursively.", "1234", "10", [
    { input: "1234", expectedOutput: "10" },
    { input: "9", expectedOutput: "9" },
    { input: "999", expectedOutput: "27" }
  ]),

  createSeedQuestion(191, "Count the number of digits in a number recursively.", 3, "Medium", "Given non-negative integer N, count its total number of digits recursively.", "12345", "5", [
    { input: "12345", expectedOutput: "5" },
    { input: "0", expectedOutput: "1" },
    { input: "7", expectedOutput: "1" }
  ]),

  createSeedQuestion(192, "Reverse a number recursively.", 3, "Hard", "Given positive integer N, reverse its digits recursively without leading zeros.", "1234", "4321", [
    { input: "1234", expectedOutput: "4321" },
    { input: "100", expectedOutput: "1" }
  ]),

  createSeedQuestion(193, "Check if a number is a palindrome using recursion.", 3, "Hard", "Check whether a given positive integer N is a palindrome recursively. Print 'Yes' or 'No'.", "121", "Yes", [
    { input: "121", expectedOutput: "Yes" },
    { input: "123", expectedOutput: "No" },
    { input: "7", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(194, "Find product of digits of a number recursively.", 3, "Medium", "Given positive integer N, compute the product of its digits recursively.", "234", "24", [
    { input: "234", expectedOutput: "24" },
    { input: "105", expectedOutput: "0" }
  ]),

  createSeedQuestion(195, "Find GCD (HCF) of two numbers using Euclid's algorithm recursively.", 3, "Medium", "Given two positive integers A and B on separate lines, compute their GCD using Euclid's recursive algorithm.", "48\n18", "6", [
    { input: "48\n18", expectedOutput: "6" },
    { input: "7\n13", expectedOutput: "1" }
  ]),

  createSeedQuestion(196, "Convert a number to binary recursively.", 3, "Hard", "Given positive integer N, print its binary representation recursively.", "10", "1010", [
    { input: "10", expectedOutput: "1010" },
    { input: "7", expectedOutput: "111" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(197, "Print digits of a number in words recursively (e.g., 123 → \"one two three\").", 3, "Hard", "Given positive integer N, print its digits in words separated by space recursively (e.g., 123 -> 'one two three').", "123", "one two three", [
    { input: "123", expectedOutput: "one two three" },
    { input: "50", expectedOutput: "five zero" }
  ]),

  createSeedQuestion(198, "Calculate the sum of first n even numbers recursively.", 3, "Medium", "Given N, calculate the sum of the first N even positive numbers (2 + 4 + ... + 2N) recursively.", "4", "20", [
    { input: "4", expectedOutput: "20" },
    { input: "1", expectedOutput: "2" }
  ]),

  createSeedQuestion(199, "Calculate the sum of first n odd numbers recursively.", 3, "Medium", "Given N, calculate the sum of the first N odd positive numbers (1 + 3 + ... + 2N-1) recursively.", "4", "16", [
    { input: "4", expectedOutput: "16" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(200, "Find nCr (Combination formula) recursively using Pascal's relation.", 3, "Hard", "Given N and R (0 <= R <= N) on separate lines, compute combination nCr using Pascal's recursive relation nCr = (n-1)C(r-1) + (n-1)Cr.", "5\n2", "10", [
    { input: "5\n2", expectedOutput: "10" },
    { input: "4\n0", expectedOutput: "1" },
    { input: "4\n4", expectedOutput: "1" }
  ]),

  createSeedQuestion(201, "Print a line of n stars recursively.", 3, "Medium", "Given N, print a line of N asterisks '*' recursively.", "5", "*****", [
    { input: "5", expectedOutput: "*****" },
    { input: "1", expectedOutput: "*" }
  ]),

  createSeedQuestion(202, "Print a square of stars recursively (n×n).", 3, "Hard", "Given N, print an N x N square of asterisks '*' using recursion.", "3", "***\n***\n***", [
    { input: "3", expectedOutput: "***\n***\n***" },
    { input: "1", expectedOutput: "*" }
  ]),

  createSeedQuestion(203, "Print a triangle of stars recursively (top-down).", 3, "Hard", "Given N, print a top-down right-angled triangle of stars (row 1 has 1 star, row N has N stars) recursively.", "3", "*\n**\n***", [
    { input: "3", expectedOutput: "*\n**\n***" },
    { input: "1", expectedOutput: "*" }
  ]),

  createSeedQuestion(204, "Print a triangle of stars recursively (bottom-up).", 3, "Hard", "Given N, print an inverted right-angled triangle of stars (row 1 has N stars, row N has 1 star) recursively.", "3", "***\n**\n*", [
    { input: "3", expectedOutput: "***\n**\n*" },
    { input: "1", expectedOutput: "*" }
  ]),

  createSeedQuestion(205, "Print pattern of numbers recursively (1 to n each row).", 3, "Hard", "Given N, print number triangle where row i contains 1 to i space-separated recursively.", "3", "1\n1 2\n1 2 3", [
    { input: "3", expectedOutput: "1\n1 2\n1 2 3" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(206, "Print reverse triangle pattern recursively.", 3, "Hard", "Given N, print reverse number triangle where row 1 has 1 to N, row 2 has 1 to N-1, etc. recursively.", "3", "1 2 3\n1 2\n1", [
    { input: "3", expectedOutput: "1 2 3\n1 2\n1" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(207, "Print multiplication table of n recursively.", 3, "Medium", "Given N, print the multiplication table of N from 1 to 10 in format 'N x i = R' recursively.", "5", "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50", [
    { input: "5", expectedOutput: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50" }
  ]),

  createSeedQuestion(208, "Print numbers in increasing and decreasing order in same function.", 3, "Hard", "Given N, print numbers from 1 to N and then back down to 1 in a single recursive traversal.", "3", "1 2 3 2 1", [
    { input: "3", expectedOutput: "1 2 3 2 1" },
    { input: "1", expectedOutput: "1 1" }
  ]),

  createSeedQuestion(209, "Print sum of series 1 + 2 + 3 + ... + n recursively and display each step.", 3, "Hard", "Given N, calculate sum 1 to N and print running prefix sums on each recursive step.", "3", "1\n3\n6", [
    { input: "3", expectedOutput: "1\n3\n6" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(210, "Print pattern of characters (A, AB, ABC, ...) recursively.", 3, "Hard", "Given N (1 <= N <= 26), print character triangle (row 1 'A', row 2 'AB', row N 'ABC...') recursively.", "3", "A\nAB\nABC", [
    { input: "3", expectedOutput: "A\nAB\nABC" },
    { input: "1", expectedOutput: "A" }
  ]),

  createSeedQuestion(211, "Reverse a string using recursion.", 3, "Medium", "Given string S, reverse it recursively without using loops.", "hello", "olleh", [
    { input: "hello", expectedOutput: "olleh" },
    { input: "recursion", expectedOutput: "noisrucer" }
  ]),

  createSeedQuestion(212, "Check if a string is palindrome using recursion.", 3, "Medium", "Given string S, check if it is a palindrome using recursion. Print 'Yes' or 'No'.", "racecar", "Yes", [
    { input: "racecar", expectedOutput: "Yes" },
    { input: "code", expectedOutput: "No" }
  ]),

  createSeedQuestion(213, "Count vowels in a string recursively.", 3, "Medium", "Given string S, count its total vowels recursively.", "insidcode", "4", [
    { input: "insidcode", expectedOutput: "4" },
    { input: "xyz", expectedOutput: "0" }
  ]),

  createSeedQuestion(214, "Remove all spaces from a string recursively.", 3, "Hard", "Given string S, remove all spaces recursively.", "hello world", "helloworld", [
    { input: "hello world", expectedOutput: "helloworld" }
  ]),

  createSeedQuestion(215, "Replace all occurrences of a character (say 'a' → 'x') recursively.", 3, "Hard", "Given string S, target char C1, and replacement char C2 on separate lines, replace all C1 with C2 recursively.", "banana\na\nx", "bxnxnx", [
    { input: "banana\na\nx", expectedOutput: "bxnxnx" }
  ]),

  createSeedQuestion(216, "Remove all occurrences of a character from a string recursively.", 3, "Hard", "Given string S and char C on separate lines, remove all occurrences of C recursively.", "banana\na", "bnn", [
    { input: "banana\na", expectedOutput: "bnn" }
  ]),

  createSeedQuestion(217, "Print all characters of a string one by one recursively.", 3, "Medium", "Given string S, print each character on a new line using recursion.", "code", "c\no\nd\ne", [
    { input: "code", expectedOutput: "c\no\nd\ne" }
  ]),

  createSeedQuestion(218, "Print the string in reverse order recursively (without using loops).", 3, "Medium", "Given string S, print its characters in reverse order on a single line separated by space recursively.", "code", "e d o c", [
    { input: "code", expectedOutput: "e d o c" }
  ]),

  createSeedQuestion(219, "Convert a string to uppercase recursively.", 3, "Medium", "Given string S, convert it to uppercase recursively.", "hello", "HELLO", [
    { input: "hello", expectedOutput: "HELLO" }
  ]),

  createSeedQuestion(220, "Count consonants and vowels separately using recursion.", 3, "Hard", "Given string S, count consonants and vowels recursively. Print in format 'Vowels: V, Consonants: C'.", "apple", "Vowels: 2, Consonants: 3", [
    { input: "apple", expectedOutput: "Vowels: 2, Consonants: 3" },
    { input: "sky", expectedOutput: "Vowels: 0, Consonants: 3" }
  ])];
