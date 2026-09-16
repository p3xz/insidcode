import { QuestionSeedItem, createSeedQuestion } from "./curriculumData";

export const CURRICULUM_PLACEMENT: QuestionSeedItem[] = [
  createSeedQuestion(281, "Find the sum of all digits of a number repeatedly until a single digit is obtained (Digital Root).", 6, "Medium", "Given non-negative integer N, find the sum of all digits repeatedly until a single digit is obtained (Digital Root).", "9875", "2", [
    { input: "9875", expectedOutput: "2" },
    { input: "38", expectedOutput: "2" },
    { input: "0", expectedOutput: "0" }
  ]),

  createSeedQuestion(282, "Check if a number is an Automorphic number (square of number ends with the number itself, e.g., 25² = 625).", 6, "Medium", "Check whether an integer N is an Automorphic number (square of N ends with N). Print 'Yes' or 'No'.", "25", "Yes", [
    { input: "25", expectedOutput: "Yes" },
    { input: "76", expectedOutput: "Yes" },
    { input: "13", expectedOutput: "No" }
  ]),

  createSeedQuestion(283, "Check if a number is a Harshad (Niven) number (divisible by the sum of its digits, e.g., 18 ÷ (1+8) = 2).", 6, "Medium", "Check whether positive integer N is a Harshad (Niven) number (divisible by the sum of its digits). Print 'Yes' or 'No'.", "18", "Yes", [
    { input: "18", expectedOutput: "Yes" },
    { input: "19", expectedOutput: "No" },
    { input: "21", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(284, "Check if a number is an Abundant or Deficient number (sum of proper divisors > number).", 6, "Medium", "Given positive integer N, calculate sum of proper divisors S. If S > N print 'Abundant', if S < N print 'Deficient', else 'Perfect'.", "12", "Abundant", [
    { input: "12", expectedOutput: "Abundant" },
    { input: "15", expectedOutput: "Deficient" },
    { input: "6", expectedOutput: "Perfect" }
  ]),

  createSeedQuestion(285, "Check if a number is a Kaprekar number (split square into two parts whose sum equals the original number, e.g., 45² = 2025, 20 + 25 = 45).", 6, "Hard", "Check if positive integer N is a Kaprekar number (split square into two parts that sum to N). Print 'Yes' or 'No'.", "45", "Yes", [
    { input: "45", expectedOutput: "Yes" },
    { input: "9", expectedOutput: "Yes" },
    { input: "10", expectedOutput: "No" }
  ]),

  createSeedQuestion(286, "Print all Spy numbers in a range (a number where sum of digits equals product of digits, e.g., 1124).", 6, "Medium", "Given range L and R on separate lines, print all Spy numbers (digit sum equals digit product) separated by space.", "1000\n1200", "1124 1142", [
    { input: "1000\n1200", expectedOutput: "1124 1142" },
    { input: "1\n20", expectedOutput: "1 2 3 4 5 6 7 8 9" }
  ]),

  createSeedQuestion(287, "Find the count of trailing zeros in the factorial of N without computing the full factorial (count factors of 5).", 6, "Medium", "Given positive integer N, find the count of trailing zeros in N! without calculating the factorial directly.", "100", "24", [
    { input: "100", expectedOutput: "24" },
    { input: "5", expectedOutput: "1" },
    { input: "25", expectedOutput: "6" }
  ]),

  createSeedQuestion(288, "Convert an integer into its Roman numeral representation.", 6, "Hard", "Given integer N (1 <= N <= 3999), convert it into its standard Roman numeral string.", "1994", "MCMXCIV", [
    { input: "1994", expectedOutput: "MCMXCIV" },
    { input: "58", expectedOutput: "LVIII" },
    { input: "9", expectedOutput: "IX" }
  ]),

  createSeedQuestion(289, "Check if a given even number can be expressed as the sum of two prime numbers (Goldbach's conjecture verification).", 6, "Medium", "Given an even number N (> 2), find two prime numbers p1 and p2 (p1 <= p2) such that p1 + p2 = N. Print in format 'p1 p2'.", "10", "3 7", [
    { input: "10", expectedOutput: "3 7" },
    { input: "4", expectedOutput: "2 2" },
    { input: "16", expectedOutput: "3 13" }
  ]),

  createSeedQuestion(290, "Find the prime factorization of a number and display in exponential format (e.g., 12 = 2^2 * 3^1).", 6, "Hard", "Given integer N (>= 2), print its prime factorization in ascending prime order separated by space (format 'p^k').", "12", "2^2 3^1", [
    { input: "12", expectedOutput: "2^2 3^1" },
    { input: "18", expectedOutput: "2^1 3^2" },
    { input: "13", expectedOutput: "13^1" }
  ]),

  createSeedQuestion(291, "Given a sorted array, find two elements that sum to a target value k using the two-pointer technique.", 6, "Medium", "Given sorted array of N integers on line 2 and target K on line 3, find two 0-based indices that sum to K using two pointers. Print 'i j' or '-1'.", "5\n1 2 3 4 6\n6", "1 3", [
    { input: "5\n1 2 3 4 6\n6", expectedOutput: "1 3" },
    { input: "3\n2 5 9\n8", expectedOutput: "-1" }
  ]),

  createSeedQuestion(292, "Remove duplicate elements in-place from a sorted array and return the new length without allocating a secondary array.", 6, "Hard", "Given sorted array of N integers, remove duplicates in-place and print the new length followed by space and the unique elements.", "5\n1 1 2 2 3", "3 1 2 3", [
    { input: "5\n1 1 2 2 3", expectedOutput: "3 1 2 3" }
  ]),

  createSeedQuestion(293, "Given an array containing only 0s, 1s, and 2s, sort it in a single pass without using built-in sort (Dutch National Flag algorithm).", 6, "Hard", "Given array of N elements consisting of only 0s, 1s, and 2s, sort in single pass using Dutch National Flag algorithm.", "6\n2 0 2 1 1 0", "0 0 1 1 2 2", [
    { input: "6\n2 0 2 1 1 0", expectedOutput: "0 0 1 1 2 2" }
  ]),

  createSeedQuestion(294, "Find the maximum sum of any contiguous subarray of size k (Fixed-size sliding window).", 6, "Medium", "Given N integers on line 2 and K on line 3, find maximum sum of any contiguous subarray of size K.", "6\n2 1 5 1 3 2\n3", "9", [
    { input: "6\n2 1 5 1 3 2\n3", expectedOutput: "9" }
  ]),

  createSeedQuestion(295, "Find the length of the longest contiguous subarray with an equal count of 0s and 1s.", 6, "Hard", "Given binary array containing 0s and 1s, find the maximum length of a contiguous subarray with an equal number of 0s and 1s.", "4\n0 1 0 1", "4", [
    { input: "4\n0 1 0 1", expectedOutput: "4" },
    { input: "2\n0 1", expectedOutput: "2" },
    { input: "3\n0 0 0", expectedOutput: "0" }
  ]),

  createSeedQuestion(296, "Given two sorted arrays, merge them into a single sorted array without using library sort functions.", 6, "Medium", "Given two sorted arrays, merge them into a single sorted array in O(N+M) time without library sort.", "3\n1 3 5\n3\n2 4 6", "1 2 3 4 5 6", [
    { input: "3\n1 3 5\n3\n2 4 6", expectedOutput: "1 2 3 4 5 6" }
  ]),

  createSeedQuestion(297, "Find the intersection of two sorted arrays in linear time using two pointers.", 6, "Hard", "Given two sorted arrays, find their intersection elements using two pointers and print separated by space.", "5\n1 2 2 3 4\n4\n2 2 4 6", "2 2 4", [
    { input: "5\n1 2 2 3 4\n4\n2 2 4 6", expectedOutput: "2 2 4" }
  ]),

  createSeedQuestion(298, "Check if an array can be partitioned into two contiguous segments such that both segments have equal sum.", 6, "Medium", "Check if array of N integers can be partitioned into two contiguous segments of equal sum. Print 'Yes' or 'No'.", "4\n1 2 3 6", "Yes", [
    { input: "4\n1 2 3 6", expectedOutput: "Yes" },
    { input: "3\n1 2 4", expectedOutput: "No" }
  ]),

  createSeedQuestion(299, "Calculate trapped rainwater between building heights represented as an array (Two-pointer elevation logic).", 6, "Hard", "Given array of N non-negative integers representing elevation map, compute total trapped rainwater.", "6\n0 1 0 2 1 3", "2", [
    { input: "6\n0 1 0 2 1 3", expectedOutput: "2" },
    { input: "3\n3 0 2", expectedOutput: "2" }
  ]),

  createSeedQuestion(300, "Rearrange an array such that positive and negative numbers alternate in position.", 6, "Medium", "Given array with equal count of positive and negative integers, rearrange them so positive and negative numbers alternate starting with positive.", "6\n3 1 -2 -5 2 -4", "3 -2 1 -5 2 -4", [
    { input: "6\n3 1 -2 -5 2 -4", expectedOutput: "3 -2 1 -5 2 -4" }
  ]),

  createSeedQuestion(301, "Implement Run-Length Encoding on a string (e.g., \"aaabbc\" → \"a3b2c1\").", 6, "Medium", "Given string S, perform Run-Length Encoding (e.g. 'aaabbc' -> 'a3b2c1').", "aaabbc", "a3b2c1", [
    { input: "aaabbc", expectedOutput: "a3b2c1" },
    { input: "abcd", expectedOutput: "a1b1c1d1" }
  ]),

  createSeedQuestion(302, "Decode a Run-Length Encoded string back to original form (e.g., \"a3b2c1\" → \"aaabbc\").", 6, "Hard", "Given run-length encoded string (e.g. 'a3b2c1'), decode back to original full string.", "a3b2c1", "aaabbc", [
    { input: "a3b2c1", expectedOutput: "aaabbc" }
  ]),

  createSeedQuestion(303, "Check if a sentence is a Pangram (contains every alphabet from 'a' to 'z' at least once).", 6, "Medium", "Check whether a given sentence is a Pangram (contains every letter from a to z). Print 'Yes' or 'No'.", "The quick brown fox jumps over the lazy dog", "Yes", [
    { input: "The quick brown fox jumps over the lazy dog", expectedOutput: "Yes" },
    { input: "Hello World", expectedOutput: "No" }
  ]),

  createSeedQuestion(304, "Find the length of the longest word in a sentence without using split() or built-in array methods.", 6, "Hard", "Given a sentence, find the length of the longest word without using built-in split methods.", "Master algorithmic logic easily", "11", [
    { input: "Master algorithmic logic easily", expectedOutput: "11" },
    { input: "a bb ccc", expectedOutput: "3" }
  ]),

  createSeedQuestion(305, "Count the frequency of each word in a paragraph manually.", 6, "Medium", "Given a sentence, count the frequency of each unique word in order of first appearance, format 'word: count'.", "apple orange apple banana orange apple", "apple: 3\norange: 2\nbanana: 1", [
    { input: "apple orange apple banana orange apple", expectedOutput: "apple: 3\norange: 2\nbanana: 1" }
  ]),

  createSeedQuestion(306, "Check if one string is a subsequence (not necessarily contiguous) of another.", 6, "Hard", "Given two strings S1 and S2 on separate lines, check if S1 is a subsequence of S2. Print 'Yes' or 'No'.", "abc\nahbgdc", "Yes", [
    { input: "abc\nahbgdc", expectedOutput: "Yes" },
    { input: "axc\nahbgdc", expectedOutput: "No" }
  ]),

  createSeedQuestion(307, "Validate an IPv4 address format (four integers separated by dots, each 0-255 with no leading zeros).", 6, "Medium", "Validate IPv4 address format strictly (4 octets 0-255 with no leading zeros). Print 'Valid' or 'Invalid'.", "172.16.254.1", "Valid", [
    { input: "172.16.254.1", expectedOutput: "Valid" },
    { input: "172.16.254.01", expectedOutput: "Invalid" }
  ]),

  createSeedQuestion(308, "Verify whether parentheses `()`, `{}`, `[]` in a string are properly balanced (using an array as a stack).", 6, "Hard", "Given string of bracket characters, verify if parentheses (), {}, [] are properly balanced. Print 'Valid' or 'Invalid'.", "{[()]}", "Valid", [
    { input: "{[()]}", expectedOutput: "Valid" },
    { input: "{[(])}", expectedOutput: "Invalid" }
  ]),

  createSeedQuestion(309, "Find the first non-repeating character in a string in a single traversal using a frequency counter.", 6, "Medium", "Given string S, find first non-repeating character in a single traversal. If none, print -1.", "swiss", "w", [
    { input: "swiss", expectedOutput: "w" },
    { input: "aabb", expectedOutput: "-1" }
  ]),

  createSeedQuestion(310, "Compress a string by replacing repeating characters only if the compressed result is strictly shorter than the original.", 6, "Hard", "Compress string by count. Return compressed string only if strictly shorter than original, else return original.", "aabcccccaaa", "a2b1c5a3", [
    { input: "aabcccccaaa", expectedOutput: "a2b1c5a3" },
    { input: "abcd", expectedOutput: "abcd" }
  ]),

  createSeedQuestion(311, "Check if a number is a power of 2 using bitwise operators (`n & (n - 1)`).", 6, "Easy", "Check if integer N is a power of 2 using bitwise operators. Print 'Yes' or 'No'.", "16", "Yes", [
    { input: "16", expectedOutput: "Yes" },
    { input: "18", expectedOutput: "No" },
    { input: "1", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(312, "Count the number of set bits (1s) in the binary representation of an integer (Brian Kernighan's algorithm).", 6, "Medium", "Given non-negative integer N, count number of set bits (1s) in binary using Brian Kernighan's algorithm.", "15", "4", [
    { input: "15", expectedOutput: "4" },
    { input: "8", expectedOutput: "1" },
    { input: "0", expectedOutput: "0" }
  ]),

  createSeedQuestion(313, "Swap two integers without using a temporary variable using bitwise XOR.", 6, "Easy", "Given two integers A and B on separate lines, swap them using bitwise XOR and print in format 'A B'.", "10\n20", "20 10", [
    { input: "10\n20", expectedOutput: "20 10" },
    { input: "-5\n5", expectedOutput: "5 -5" }
  ]),

  createSeedQuestion(314, "Find the only element in an array that appears once while all other elements appear twice (using XOR).", 6, "Medium", "Given array of N integers where every element appears twice except one, find that single element using XOR.", "5\n4 1 2 1 2", "4", [
    { input: "5\n4 1 2 1 2", expectedOutput: "4" },
    { input: "3\n2 2 1", expectedOutput: "1" }
  ]),

  createSeedQuestion(315, "Check if the kth bit of a number is set (1) or unset (0).", 6, "Medium", "Given number N on line 1 and bit position K (0-indexed) on line 2, check if K-th bit is set. Print 'Set' or 'Unset'.", "5\n0", "Set", [
    { input: "5\n0", expectedOutput: "Set" },
    { input: "5\n1", expectedOutput: "Unset" }
  ]),

  createSeedQuestion(316, "Find the two non-repeating elements in an array where every other element appears twice.", 6, "Hard", "Given array where all elements appear twice except two numbers, find those two numbers in ascending order separated by space.", "6\n1 2 3 2 1 4", "3 4", [
    { input: "6\n1 2 3 2 1 4", expectedOutput: "3 4" }
  ]),

  createSeedQuestion(317, "Reverse the 32 bits of an unsigned integer.", 6, "Medium", "Given unsigned 32-bit integer, reverse its binary representation and print as decimal.", "43261596", "964176192", [
    { input: "43261596", expectedOutput: "964176192" }
  ]),

  createSeedQuestion(318, "Multiply a number by 2 and divide by 2 using left and right bit shift operators.", 6, "Easy", "Given integer N, print N multiplied by 2 (using << 1) and N divided by 2 (using >> 1) separated by space.", "10", "20 5", [
    { input: "10", expectedOutput: "20 5" },
    { input: "7", expectedOutput: "14 3" }
  ]),

  createSeedQuestion(319, "Generate all binary strings of length n that do not contain consecutive 1s.", 6, "Hard", "Given integer N (1 <= N <= 10), count all binary strings of length N that do not contain consecutive 1s.", "3", "5", [
    { input: "3", expectedOutput: "5" },
    { input: "2", expectedOutput: "3" },
    { input: "1", expectedOutput: "2" }
  ]),

  createSeedQuestion(320, "Find the single missing number in an array containing numbers from 1 to n using XOR.", 6, "Hard", "Given array of N-1 integers from range 1 to N, find the single missing number using bitwise XOR.", "4\n1 2 4", "3", [
    { input: "4\n1 2 4", expectedOutput: "3" },
    { input: "2\n1", expectedOutput: "2" }
  ]),

  createSeedQuestion(321, "Find the sum of both the primary and secondary diagonal elements of a square matrix.", 6, "Medium", "Given N followed by N x N matrix, find sum of both primary and secondary diagonals (if N is odd, center element counted once).", "3\n1 2 3\n4 5 6\n7 8 9", "25", [
    { input: "3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "25" },
    { input: "2\n1 1\n1 1", expectedOutput: "4" }
  ]),

  createSeedQuestion(322, "Check if a given square matrix is symmetric (A[i][j] == A[j][i] for all elements).", 6, "Medium", "Given N followed by N x N matrix, check if matrix is symmetric (A[i][j] == A[j][i]). Print 'Yes' or 'No'.", "3\n1 2 3\n2 4 5\n3 5 6", "Yes", [
    { input: "3\n1 2 3\n2 4 5\n3 5 6", expectedOutput: "Yes" },
    { input: "2\n1 2\n3 4", expectedOutput: "No" }
  ]),

  createSeedQuestion(323, "Transpose an N \\times N matrix in-place without allocating a new matrix.", 6, "Hard", "Given N followed by N x N matrix, transpose in-place and print.", "2\n1 2\n3 4", "1 3\n2 4", [
    { input: "2\n1 2\n3 4", expectedOutput: "1 3\n2 4" }
  ]),

  createSeedQuestion(324, "Rotate an N \\times N matrix by 90 degrees clockwise (transpose then reverse each row).", 6, "Hard", "Given N followed by N x N matrix, rotate 90 degrees clockwise and print.", "3\n1 2 3\n4 5 6\n7 8 9", "7 4 1\n8 5 2\n9 6 3", [
    { input: "3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "7 4 1\n8 5 2\n9 6 3" }
  ]),

  createSeedQuestion(325, "Print all elements of an M \\times N matrix in Spiral Order.", 6, "Hard", "Given dimensions R and C followed by R x C matrix, print all elements in Spiral Order separated by space.", "3 3\n1 2 3\n4 5 6\n7 8 9", "1 2 3 6 9 8 7 4 5", [
    { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "1 2 3 6 9 8 7 4 5" }
  ]),

  createSeedQuestion(326, "Print elements of an M \\times N matrix in Zig-Zag / Snake pattern (alternating rows left-to-right and right-to-left).", 6, "Hard", "Given R and C followed by R x C matrix, print elements in Snake / Zig-Zag traversal (row 0 left-to-right, row 1 right-to-left, etc.).", "3 3\n1 2 3\n4 5 6\n7 8 9", "1 2 3 6 5 4 7 8 9", [
    { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "1 2 3 6 5 4 7 8 9" }
  ]),

  createSeedQuestion(327, "Find the row index that has the maximum number of 1s in a boolean 2D matrix.", 6, "Medium", "Given R and C followed by boolean matrix (0s and 1s), find 0-based row index with maximum number of 1s.", "3 4\n0 1 1 1\n0 0 1 1\n1 1 1 1", "2", [
    { input: "3 4\n0 1 1 1\n0 0 1 1\n1 1 1 1", expectedOutput: "2" }
  ]),

  createSeedQuestion(328, "Check whether an N \\times N matrix is an Identity matrix (1s on the main diagonal, 0s everywhere else).", 6, "Hard", "Given N followed by N x N matrix, check whether it is an Identity matrix (1s on main diagonal, 0s elsewhere). Print 'Yes' or 'No'.", "3\n1 0 0\n0 1 0\n0 0 1", "Yes", [
    { input: "3\n1 0 0\n0 1 0\n0 0 1", expectedOutput: "Yes" },
    { input: "2\n1 0\n1 1", expectedOutput: "No" }
  ]),

  createSeedQuestion(329, "Find the saddle point of a matrix (an element that is strictly minimum in its row and maximum in its column).", 6, "Medium", "Given R and C followed by R x C matrix, find saddle point (minimum in its row, maximum in its column). If exists print value, else '-1'.", "3 3\n1 2 3\n4 5 6\n7 8 9", "7", [
    { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "7" }
  ]),

  createSeedQuestion(330, "Search for a target value in a row-wise and column-wise sorted 2D matrix in \\mathcal{O}(M + N) time.", 6, "Hard", "Given R and C followed by R x C matrix sorted row-wise and column-wise, and target X on next line, check if X exists in O(M+N) time. Print 'Yes' or 'No'.", "3 3\n1 4 7\n2 5 8\n3 6 9\n5", "Yes", [
    { input: "3 3\n1 4 7\n2 5 8\n3 6 9\n5", expectedOutput: "Yes" },
    { input: "3 3\n1 4 7\n2 5 8\n3 6 9\n20", expectedOutput: "No" }
  ])];
