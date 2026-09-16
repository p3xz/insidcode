import { QuestionSeedItem, createSeedQuestion } from "./curriculumData";

export const CURRICULUM_ADVANCED: QuestionSeedItem[] = [
  createSeedQuestion(221, "Print all numbers whose sum of digits is even (1 to 100).", 6, "Medium", "Print all numbers between 1 and 100 inclusive whose sum of digits is an even number, separated by space.", "", "2 4 6 8 11 13 15 17 19 20 22 24 26 28 31 33 35 37 39 40 42 44 46 48 51 53 55 57 59 60 62 64 66 68 71 73 75 77 79 80 82 84 86 88 91 93 95 97 99", [
    { input: "", expectedOutput: "2 4 6 8 11 13 15 17 19 20 22 24 26 28 31 33 35 37 39 40 42 44 46 48 51 53 55 57 59 60 62 64 66 68 71 73 75 77 79 80 82 84 86 88 91 93 95 97 99" }
  ]),

  createSeedQuestion(222, "Count how many numbers between 1-500 are divisible by 7 but not by 5.", 6, "Easy", "Count how many numbers between 1 and 500 are divisible by 7 but not by 5.", "", "57", [
    { input: "", expectedOutput: "57" }
  ]),

  createSeedQuestion(223, "Print all numbers that are palindromes between 1-500.", 6, "Medium", "Print all numbers between 1 and 100 that are palindromes, separated by space.", "", "1 2 3 4 5 6 7 8 9 11 22 33 44 55 66 77 88 99", [
    { input: "", expectedOutput: "1 2 3 4 5 6 7 8 9 11 22 33 44 55 66 77 88 99" }
  ]),

  createSeedQuestion(224, "Print numbers between 1-100 whose digits add up to a multiple of 3.", 6, "Medium", "Print all numbers between 1 and 50 whose digits add up to a multiple of 3, separated by space.", "", "3 6 9 12 15 18 21 24 27 30 33 36 39 42 45 48", [
    { input: "", expectedOutput: "3 6 9 12 15 18 21 24 27 30 33 36 39 42 45 48" }
  ]),

  createSeedQuestion(225, "Find the smallest and largest digit in a given number.", 6, "Easy", "Given a positive integer N, find the smallest and largest digit in format 'Smallest: S, Largest: L'.", "49205", "Smallest: 0, Largest: 9", [
    { input: "49205", expectedOutput: "Smallest: 0, Largest: 9" },
    { input: "777", expectedOutput: "Smallest: 7, Largest: 7" }
  ]),

  createSeedQuestion(226, "Print all numbers from 1 to n whose binary representation has an even number of 1s.", 6, "Hard", "Given N, print all numbers from 1 to N whose binary representation has an even number of set bits (1s), separated by space.", "10", "3 5 6 9 10", [
    { input: "10", expectedOutput: "3 5 6 9 10" },
    { input: "5", expectedOutput: "3 5" }
  ]),

  createSeedQuestion(227, "Print a pattern where each row i prints i*i.", 6, "Medium", "Given N, print N rows where row i (1-indexed) prints i*i.", "4", "1\n4\n9\n16", [
    { input: "4", expectedOutput: "1\n4\n9\n16" },
    { input: "2", expectedOutput: "1\n4" }
  ]),

  createSeedQuestion(228, "Print factorial of each number from 1 to n.", 6, "Medium", "Given N (>= 2), print a hollow square of size N x N made of asterisks '*'.", "4", "****\n*  *\n*  *\n****", [
    { input: "4", expectedOutput: "****\n*  *\n*  *\n****" },
    { input: "3", expectedOutput: "***\n* *\n***" }
  ]),

  createSeedQuestion(229, "Print the sum of all odd digits and even digits separately in a number.", 6, "Medium", "Given N (1 <= N <= 10), print first N rows of Pascal's triangle with space-separated numbers.", "4", "1\n1 1\n1 2 1\n1 3 3 1", [
    { input: "4", expectedOutput: "1\n1 1\n1 2 1\n1 3 3 1" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(230, "Take 5 numbers as input. If the user enters 0, skip it using continue. At the end, print the sum of all non-zero numbers entered.", 6, "Easy", "Given N, print Floyd's triangle with consecutive numbers up to N rows.", "3", "1\n2 3\n4 5 6", [
    { input: "3", expectedOutput: "1\n2 3\n4 5 6" },
    { input: "2", expectedOutput: "1\n2 3" }
  ]),

  createSeedQuestion(231, "Print all numbers between 1 and N that are divisible by both 3 and 5.", 6, "Easy", "Given N, print Butterfly star pattern of 2N rows.", "3", "*    *\n**  **\n******\n******\n**  **\n*    *", [
    { input: "3", expectedOutput: "*    *\n**  **\n******\n******\n**  **\n*    *" }
  ]),

  createSeedQuestion(232, "Find the sum of digits of a number (use loop).", 6, "Easy", "Given N, print Diamond pattern of stars with width 2N-1.", "3", "  *\n ***\n*****\n ***\n  *", [
    { input: "3", expectedOutput: "  *\n ***\n*****\n ***\n  *" }
  ]),

  createSeedQuestion(233, "Check if a number is an Armstrong number.", 6, "Medium", "Given N, print Hourglass pattern of stars.", "3", "*****\n ***\n  *\n ***\n*****", [
    { input: "3", expectedOutput: "*****\n ***\n  *\n ***\n*****" }
  ]),

  createSeedQuestion(234, "Print all Armstrong numbers between 1 and 1000.", 6, "Medium", "Given N, print spiral matrix of numbers 1 to N^2 of size N x N.", "3", "1 2 3\n8 9 4\n7 6 5", [
    { input: "3", expectedOutput: "1 2 3\n8 9 4\n7 6 5" }
  ]),

  createSeedQuestion(235, "Find the factorial of a number using recursion.", 6, "Medium", "Given N, print an N x N grid with zigzag (snake) row traversal numbering.", "3", "1 2 3\n6 5 4\n7 8 9", [
    { input: "3", expectedOutput: "1 2 3\n6 5 4\n7 8 9" }
  ]),

  createSeedQuestion(236, "Count how many even digits a number contains.", 6, "Easy", "Given N, print an N x N checkerboard alternating between 0 and 1 starting with 0 at (0,0).", "3", "0 1 0\n1 0 1\n0 1 0", [
    { input: "3", expectedOutput: "0 1 0\n1 0 1\n0 1 0" }
  ]),

  createSeedQuestion(237, "Print all prime numbers between 1 and N.", 6, "Medium", "Given N, print inverted pyramid of stars with N rows.", "3", "*****\n ***\n  *", [
    { input: "3", expectedOutput: "*****\n ***\n  *" }
  ]),

  createSeedQuestion(238, "Print the reverse of a number (123 → 321).", 6, "Easy", "Given N, print a rhombus pattern of stars of size N.", "3", "  ***\n ***\n***", [
    { input: "3", expectedOutput: "  ***\n ***\n***" }
  ]),

  createSeedQuestion(239, "Check if a number is palindrome (121 → true).", 6, "Easy", "Given odd integer N, print an X cross pattern of stars in an N x N grid.", "5", "*   *\n * *\n  *\n * *\n*   *", [
    { input: "5", expectedOutput: "*   *\n * *\n  *\n * *\n*   *" },
    { input: "3", expectedOutput: "* *\n *\n* *" }
  ]),

  createSeedQuestion(240, "Check if a number is perfect (sum of factors equals number).", 6, "Hard", "Given N, print concentric square pattern of numbers of size (2N-1) x (2N-1).", "2", "2 2 2\n2 1 2\n2 2 2", [
    { input: "2", expectedOutput: "2 2 2\n2 1 2\n2 2 2" }
  ]),

  createSeedQuestion(241, "Check if two strings are anagrams (without using collections).", 6, "Hard", "Given dimensions R and C on line 1 followed by R rows of C space-separated integers, print the matrix.", "2 3\n1 2 3\n4 5 6", "1 2 3\n4 5 6", [
    { input: "2 3\n1 2 3\n4 5 6", expectedOutput: "1 2 3\n4 5 6" }
  ]),

  createSeedQuestion(242, "Count vowels in each word of a sentence.", 6, "Medium", "Given R and C followed by an R x C matrix, calculate the sum of all elements.", "2 2\n1 2\n3 4", "10", [
    { input: "2 2\n1 2\n3 4", expectedOutput: "10" }
  ]),

  createSeedQuestion(243, "Reverse words in a string if their length is even.", 6, "Medium", "Given R and C followed by an R x C matrix, find the 0-based index of the row with the maximum sum.", "3 2\n1 2\n5 6\n3 1", "1", [
    { input: "3 2\n1 2\n5 6\n3 1", expectedOutput: "1" }
  ]),

  createSeedQuestion(244, "Replace every vowel in a string with its position (a=1, e=2...).", 6, "Medium", "Given R and C followed by an R x C matrix, find the 0-based index of the column with the maximum sum.", "2 3\n1 5 2\n3 2 4", "1", [
    { input: "2 3\n1 5 2\n3 2 4", expectedOutput: "1" }
  ]),

  createSeedQuestion(245, "Print characters that appear more than once (without map).", 6, "Hard", "Given R and C followed by an R x C matrix, print its transpose (size C x R).", "2 3\n1 2 3\n4 5 6", "1 4\n2 5\n3 6", [
    { input: "2 3\n1 2 3\n4 5 6", expectedOutput: "1 4\n2 5\n3 6" }
  ]),

  createSeedQuestion(246, "Count words that start and end with the same letter.", 6, "Medium", "Given N followed by an N x N matrix, check if it is symmetric (A[i][j] == A[j][i]). Print 'Yes' or 'No'.", "2\n1 2\n2 1", "Yes", [
    { input: "2\n1 2\n2 1", expectedOutput: "Yes" },
    { input: "2\n1 2\n3 4", expectedOutput: "No" }
  ]),

  createSeedQuestion(247, "Toggle case for every alternate word in a sentence.", 6, "Medium", "Given N followed by an N x N matrix, print sum of primary diagonal and sum of secondary diagonal in format 'Primary: P, Secondary: S'.", "3\n1 2 3\n4 5 6\n7 8 9", "Primary: 15, Secondary: 15", [
    { input: "3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "Primary: 15, Secondary: 15" }
  ]),

  createSeedQuestion(248, "Check if two strings are rotations of each other.", 6, "Hard", "Given N followed by an N x N matrix, rotate it 90 degrees clockwise and print.", "2\n1 2\n3 4", "3 1\n4 2", [
    { input: "2\n1 2\n3 4", expectedOutput: "3 1\n4 2" }
  ]),

  createSeedQuestion(249, "Find the word with maximum vowels in a sentence.", 6, "Medium", "Given matrix A (N x M) and matrix B (M x P), compute their matrix product A x B.", "2 2\n1 2\n3 4\n2 2\n1 0\n0 1", "1 2\n3 4", [
    { input: "2 2\n1 2\n3 4\n2 2\n1 0\n0 1", expectedOutput: "1 2\n3 4" }
  ]),

  createSeedQuestion(250, "Remove duplicate words from a sentence.", 6, "Hard", "Given R and C followed by an R x C matrix, print its boundary elements in clockwise order starting from (0,0) separated by space.", "3 3\n1 2 3\n4 5 6\n7 8 9", "1 2 3 6 9 8 7 4", [
    { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "1 2 3 6 9 8 7 4" }
  ]),

  createSeedQuestion(251, "Find the maximum and minimum element in an array.", 6, "Easy", "Given N followed by N integers, sort the array using Bubble Sort and print.", "5\n5 1 4 2 8", "1 2 4 5 8", [
    { input: "5\n5 1 4 2 8", expectedOutput: "1 2 4 5 8" }
  ]),

  createSeedQuestion(252, "Count how many positive, negative, and zero elements are in an array.", 6, "Easy", "Given N followed by N integers, sort the array using Selection Sort and print.", "5\n64 25 12 22 11", "11 12 22 25 64", [
    { input: "5\n64 25 12 22 11", expectedOutput: "11 12 22 25 64" }
  ]),

  createSeedQuestion(253, "Print all unique elements from an array.", 6, "Hard", "Given N followed by N integers, sort the array using Insertion Sort and print.", "5\n12 11 13 5 6", "5 6 11 12 13", [
    { input: "5\n12 11 13 5 6", expectedOutput: "5 6 11 12 13" }
  ]),

  createSeedQuestion(254, "Reverse an array in-place.", 6, "Easy", "Given N followed by N integers containing only 0, 1, and 2, sort them in-place (Dutch National Flag problem).", "6\n2 0 2 1 1 0", "0 0 1 1 2 2", [
    { input: "6\n2 0 2 1 1 0", expectedOutput: "0 0 1 1 2 2" }
  ]),

  createSeedQuestion(255, "Shift all zeros to the end of the array.", 6, "Hard", "Given sorted array of N integers and target K, find two 0-based indices whose elements sum to K. If found print 'i j', else '-1'.", "5\n1 2 3 4 6\n6", "1 3", [
    { input: "5\n1 2 3 4 6\n6", expectedOutput: "1 3" },
    { input: "3\n1 2 3\n10", expectedOutput: "-1" }
  ]),

  createSeedQuestion(256, "Count how many elements are even at an even index.", 6, "Easy", "Given sorted array of N integers, remove duplicates in-place and print the unique elements separated by space.", "6\n1 1 2 2 3 4", "1 2 3 4", [
    { input: "6\n1 1 2 2 3 4", expectedOutput: "1 2 3 4" }
  ]),

  createSeedQuestion(257, "Merge two arrays into one.", 6, "Easy", "Given N integers, move all zeroes to the end while maintaining relative order of non-zero elements.", "6\n0 1 0 3 12 0", "1 3 12 0 0 0", [
    { input: "6\n0 1 0 3 12 0", expectedOutput: "1 3 12 0 0 0" }
  ]),

  createSeedQuestion(258, "Find the second largest element in an array.", 6, "Medium", "Given two sorted arrays, find their intersection (common elements appearing in both) and print separated by space.", "5\n1 2 3 4 5\n4\n2 4 6 8", "2 4", [
    { input: "5\n1 2 3 4 5\n4\n2 4 6 8", expectedOutput: "2 4" }
  ]),

  createSeedQuestion(259, "Rotate an array by one position to the right.", 6, "Medium", "Given two sorted arrays, merge them into a single sorted array in O(N+M) time.", "3\n1 3 5\n3\n2 4 6", "1 2 3 4 5 6", [
    { input: "3\n1 3 5\n3\n2 4 6", expectedOutput: "1 2 3 4 5 6" }
  ]),

  createSeedQuestion(260, "Find the sum of all elements at odd indices.", 6, "Easy", "Given array of N integers, check if there exists a triplet (a, b, c) such that a + b + c = 0. Print 'Yes' or 'No'.", "5\n-1 0 1 2 -1", "Yes", [
    { input: "5\n-1 0 1 2 -1", expectedOutput: "Yes" },
    { input: "3\n1 2 3", expectedOutput: "No" }
  ]),

  createSeedQuestion(261, "Print a multiplication table in a formatted grid (10x10).", 6, "Medium", "Given N followed by N integers on line 2, and window size K on line 3, find the maximum sum among all contiguous subarrays of size K.", "6\n2 1 5 1 3 2\n3", "9", [
    { input: "6\n2 1 5 1 3 2\n3", expectedOutput: "9" }
  ]),

  createSeedQuestion(262, "Print all pairs in an array whose sum equals a given number.", 6, "Hard", "Given N followed by N integers, find the maximum contiguous subarray sum (Kadane's algorithm).", "8\n-2 -3 4 -1 -2 1 5 -3", "7", [
    { input: "8\n-2 -3 4 -1 -2 1 5 -3", expectedOutput: "7" }
  ]),

  createSeedQuestion(263, "Print all subarrays of a given array.", 6, "Hard", "Given N positive integers on line 2 and target S on line 3, find the minimal length of a contiguous subarray of which the sum >= S. If none exists, print 0.", "6\n2 3 1 2 4 3\n7", "2", [
    { input: "6\n2 3 1 2 4 3\n7", expectedOutput: "2" }
  ]),

  createSeedQuestion(264, "Check if an array is sorted (ascending or descending).", 6, "Easy", "Given N integers on line 2 and target K on line 3, count the total number of continuous subarrays whose sum equals K.", "3\n1 1 1\n2", "2", [
    { input: "3\n1 1 1\n2", expectedOutput: "2" }
  ]),

  createSeedQuestion(265, "Count how many times a number appears consecutively in an array.", 6, "Medium", "Given string S, find the length of the longest substring without repeating characters.", "abcabcbb", "3", [
    { input: "abcabcbb", expectedOutput: "3" },
    { input: "bbbbb", expectedOutput: "1" }
  ]),

  createSeedQuestion(266, "Find all pairs of characters in a string that are the same (nested loop).", 6, "Medium", "Given string S on line 1 and integer K on line 2, find the length of the longest substring containing at most K distinct characters.", "eceba\n2", "3", [
    { input: "eceba\n2", expectedOutput: "3" }
  ]),

  createSeedQuestion(267, "Print pattern of increasing characters (A, AB, ABC...).", 6, "Medium", "Given binary array of N elements (0s and 1s), find maximum consecutive 1s after flipping at most one 0.", "5\n1 0 1 1 0", "4", [
    { input: "5\n1 0 1 1 0", expectedOutput: "4" }
  ]),

  createSeedQuestion(268, "Print Pascal's triangle up to N rows.", 6, "Hard", "Given N integers, find the contiguous subarray within the array which has the largest product.", "4\n2 3 -2 4", "6", [
    { input: "4\n2 3 -2 4", expectedOutput: "6" }
  ]),

  createSeedQuestion(269, "Generate Fibonacci series up to N using recursion.", 6, "Hard", "Given N integers on line 2 and target S on line 3, find 1-based start and end indices of first contiguous subarray summing to S. If none, print -1.", "5\n1 2 3 7 5\n12", "2 4", [
    { input: "5\n1 2 3 7 5\n12", expectedOutput: "2 4" }
  ]),

  createSeedQuestion(270, "Print numbers in a spiral-like pattern (conceptual dry run).", 6, "Hard", "Given N integers on line 2 and window size K on line 3, print maximum element for each sliding window of size K separated by space.", "8\n1 3 -1 -3 5 3 6 7\n3", "3 3 5 5 6 7", [
    { input: "8\n1 3 -1 -3 5 3 6 7\n3", expectedOutput: "3 3 5 5 6 7" }
  ]),

  createSeedQuestion(271, "Given marks of students, find how many passed (>= 40).", 6, "Easy", "Validate whether a given string is a valid IPv4 address. Print 'Valid' or 'Invalid'.", "192.168.1.1", "Valid", [
    { input: "192.168.1.1", expectedOutput: "Valid" },
    { input: "256.100.0.1", expectedOutput: "Invalid" }
  ]),

  createSeedQuestion(272, "Take age inputs and count how many are adults, minors, seniors.", 6, "Easy", "Given two strings S1 and S2 on separate lines, check if they are anagrams. Print 'Yes' or 'No'.", "listen\nsilent", "Yes", [
    { input: "listen\nsilent", expectedOutput: "Yes" },
    { input: "hello\nworld", expectedOutput: "No" }
  ]),

  createSeedQuestion(273, "Validate a password (at least one uppercase, lowercase, digit, special char).", 6, "Medium", "Given N words on line 2, count how many distinct anagram groups exist.", "6\neat tea tan ate nat bat", "3", [
    { input: "6\neat tea tan ate nat bat", expectedOutput: "3" }
  ]),

  createSeedQuestion(274, "Simulate a simple calculator using switch-case.", 6, "Easy", "Given N strings, find their longest common prefix. If no common prefix exists, print an empty string.", "3\nflower flow flight", "fl", [
    { input: "3\nflower flow flight", expectedOutput: "fl" },
    { input: "3\ndog racecar car", expectedOutput: "" }
  ]),

  createSeedQuestion(275, "Count how many times a coin lands on heads/tails (use random).", 6, "Easy", "Perform basic run-length string compression (e.g., 'aabcccccaaa' -> 'a2b1c5a3').", "aabcccccaaa", "a2b1c5a3", [
    { input: "aabcccccaaa", expectedOutput: "a2b1c5a3" },
    { input: "abcd", expectedOutput: "a1b1c1d1" }
  ]),

  createSeedQuestion(276, "Print frequency of each digit in a number.", 6, "Medium", "Given string containing characters '(', ')', '{', '}', '[' and ']', check if the brackets are valid and balanced. Print 'Valid' or 'Invalid'.", "()[]{}", "Valid", [
    { input: "()[]{}", expectedOutput: "Valid" },
    { input: "(]", expectedOutput: "Invalid" }
  ]),

  createSeedQuestion(277, "Find common elements between two arrays.", 6, "Hard", "Given string S, find the first non-repeating character. If none exists, print -1.", "leetcode", "l", [
    { input: "leetcode", expectedOutput: "l" },
    { input: "aabb", expectedOutput: "-1" }
  ]),

  createSeedQuestion(278, "Print characters that are common in two strings.", 6, "Hard", "Given string S, find and print the longest palindromic substring.", "babad", "bab", [
    { input: "babad", expectedOutput: "bab" },
    { input: "cbbd", expectedOutput: "bb" }
  ]),

  createSeedQuestion(279, "Count how many prime numbers are there in an array.", 6, "Hard", "Given N (1 <= N <= 10), print the Nth term of the Count and Say sequence.", "4", "1211", [
    { input: "4", expectedOutput: "1211" },
    { input: "1", expectedOutput: "1" }
  ]),

  createSeedQuestion(280, "Print all palindromic words from a sentence.", 6, "Medium", "Given a Roman numeral string, convert it to an integer.", "MCMXCIV", "1994", [
    { input: "MCMXCIV", expectedOutput: "1994" },
    { input: "LVIII", expectedOutput: "58" }
  ])];
