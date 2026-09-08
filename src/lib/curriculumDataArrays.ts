import { QuestionSeedItem, createSeedQuestion } from "./curriculumData";

export const CURRICULUM_ARRAYS: QuestionSeedItem[] = [
  createSeedQuestion(81, "Input n and take n integers into an array; print them.", 4, "Easy", "Given N followed by N space-separated integers on the next line, print them separated by space.", "4\n1 2 3 4", "1 2 3 4", [
    { input: "4\n1 2 3 4", expectedOutput: "1 2 3 4" },
    { input: "1\n99", expectedOutput: "99" },
    { input: "3\n5 10 15", expectedOutput: "5 10 15" }
  ]),

  createSeedQuestion(82, "Find the sum of all elements in an array.", 4, "Easy", "Given N followed by N space-separated integers, calculate and print the sum of all elements.", "5\n1 2 3 4 5", "15", [
    { input: "5\n1 2 3 4 5", expectedOutput: "15" },
    { input: "3\n-5 10 5", expectedOutput: "10" },
    { input: "1\n0", expectedOutput: "0" }
  ]),

  createSeedQuestion(83, "Find the average of array elements.", 4, "Easy", "Given N followed by N space-separated integers, compute the floor integer average of array elements.", "4\n2 4 6 8", "5", [
    { input: "4\n2 4 6 8", expectedOutput: "5" },
    { input: "3\n10 20 30", expectedOutput: "20" },
    { input: "5\n1 2 3 4 5", expectedOutput: "3" }
  ]),

  createSeedQuestion(84, "Find the maximum element in an array.", 4, "Easy", "Given N followed by N space-separated integers, find and print the maximum element.", "5\n3 7 2 9 5", "9", [
    { input: "5\n3 7 2 9 5", expectedOutput: "9" },
    { input: "3\n-10 -5 -20", expectedOutput: "-5" },
    { input: "1\n42", expectedOutput: "42" }
  ]),

  createSeedQuestion(85, "Find the minimum element in an array.", 4, "Easy", "Given N followed by N space-separated integers, find and print the minimum element.", "5\n3 7 2 9 5", "2", [
    { input: "5\n3 7 2 9 5", expectedOutput: "2" },
    { input: "3\n-10 -5 -20", expectedOutput: "-20" },
    { input: "1\n7", expectedOutput: "7" }
  ]),

  createSeedQuestion(86, "Count how many elements are positive, negative, or zero.", 4, "Easy", "Given N followed by N integers, count how many elements are positive, negative, or zero. Print in format 'Positive: P, Negative: N, Zero: Z'.", "5\n1 -2 0 4 -5", "Positive: 2, Negative: 2, Zero: 1", [
    { input: "5\n1 -2 0 4 -5", expectedOutput: "Positive: 2, Negative: 2, Zero: 1" },
    { input: "3\n0 0 0", expectedOutput: "Positive: 0, Negative: 0, Zero: 3" },
    { input: "2\n5 10", expectedOutput: "Positive: 2, Negative: 0, Zero: 0" }
  ]),

  createSeedQuestion(87, "Count how many elements are even and odd.", 4, "Easy", "Given N followed by N integers, count how many elements are even and odd. Print in format 'Even: E, Odd: O'.", "5\n1 2 3 4 5", "Even: 2, Odd: 3", [
    { input: "5\n1 2 3 4 5", expectedOutput: "Even: 2, Odd: 3" },
    { input: "4\n2 4 6 8", expectedOutput: "Even: 4, Odd: 0" },
    { input: "3\n1 3 5", expectedOutput: "Even: 0, Odd: 3" }
  ]),

  createSeedQuestion(88, "Find the index of the maximum element.", 4, "Easy", "Given N followed by N integers, print the 0-based index of the first occurrence of the maximum element.", "5\n10 40 20 50 30", "3", [
    { input: "5\n10 40 20 50 30", expectedOutput: "3" },
    { input: "4\n99 10 20 99", expectedOutput: "0" },
    { input: "1\n5", expectedOutput: "0" }
  ]),

  createSeedQuestion(89, "Find the index of the minimum element.", 4, "Easy", "Given N followed by N integers, print the 0-based index of the first occurrence of the minimum element.", "5\n10 40 5 50 30", "2", [
    { input: "5\n10 40 5 50 30", expectedOutput: "2" },
    { input: "3\n-10 -20 0", expectedOutput: "1" },
    { input: "1\n8", expectedOutput: "0" }
  ]),

  createSeedQuestion(90, "Take n elements and print only those greater than a given value k.", 4, "Easy", "Given N followed by N integers on line 2, and an integer K on line 3, print all elements strictly greater than K separated by space.", "5\n10 25 3 40 15\n20", "25 40", [
    { input: "5\n10 25 3 40 15\n20", expectedOutput: "25 40" },
    { input: "3\n1 2 3\n5", expectedOutput: "" },
    { input: "4\n5 10 15 20\n0", expectedOutput: "5 10 15 20" }
  ]),

  createSeedQuestion(91, "Input an element x — check if it exists in the array.", 4, "Easy", "Given N followed by N integers on line 2, and target X on line 3, check if X exists in the array. Print 'Yes' or 'No'.", "5\n1 2 3 4 5\n3", "Yes", [
    { input: "5\n1 2 3 4 5\n3", expectedOutput: "Yes" },
    { input: "4\n10 20 30 40\n25", expectedOutput: "No" },
    { input: "1\n7\n7", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(92, "Count how many times a given element appears.", 4, "Easy", "Given N followed by N integers on line 2, and target X on line 3, count how many times X appears.", "5\n1 2 2 3 2\n2", "3", [
    { input: "5\n1 2 2 3 2\n2", expectedOutput: "3" },
    { input: "4\n5 5 5 5\n5", expectedOutput: "4" },
    { input: "3\n1 2 3\n9", expectedOutput: "0" }
  ]),

  createSeedQuestion(93, "Find the first occurrence of a given number.", 4, "Easy", "Given N followed by N integers on line 2, and target X on line 3, find the 0-based index of the first occurrence of X (or -1 if not found).", "5\n10 20 30 20 50\n20", "1", [
    { input: "5\n10 20 30 20 50\n20", expectedOutput: "1" },
    { input: "3\n1 2 3\n9", expectedOutput: "-1" },
    { input: "4\n5 5 5 5\n5", expectedOutput: "0" }
  ]),

  createSeedQuestion(94, "Find the last occurrence of a given number.", 4, "Easy", "Given N followed by N integers on line 2, and target X on line 3, find the 0-based index of the last occurrence of X (or -1 if not found).", "5\n10 20 30 20 50\n20", "3", [
    { input: "5\n10 20 30 20 50\n20", expectedOutput: "3" },
    { input: "3\n1 2 3\n9", expectedOutput: "-1" },
    { input: "4\n5 5 5 5\n5", expectedOutput: "3" }
  ]),

  createSeedQuestion(95, "Check if all elements in an array are unique.", 4, "Medium", "Check whether all elements in the array are unique (no duplicates). Print 'Yes' or 'No'.", "4\n1 2 3 4", "Yes", [
    { input: "4\n1 2 3 4", expectedOutput: "Yes" },
    { input: "4\n1 2 2 3", expectedOutput: "No" },
    { input: "1\n99", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(96, "Find the sum of even elements only.", 4, "Easy", "Given N followed by N integers, find and print the sum of only the even elements.", "5\n1 2 3 4 5", "6", [
    { input: "5\n1 2 3 4 5", expectedOutput: "6" },
    { input: "3\n1 3 5", expectedOutput: "0" },
    { input: "4\n2 4 6 8", expectedOutput: "20" }
  ]),

  createSeedQuestion(97, "Find the sum of odd elements only.", 4, "Easy", "Given N followed by N integers, find and print the sum of only the odd elements.", "5\n1 2 3 4 5", "9", [
    { input: "5\n1 2 3 4 5", expectedOutput: "9" },
    { input: "3\n2 4 6", expectedOutput: "0" },
    { input: "3\n1 3 5", expectedOutput: "9" }
  ]),

  createSeedQuestion(98, "Find the count of prime numbers in the array.", 4, "Hard", "Given N followed by N integers, count how many prime numbers exist in the array.", "5\n2 3 4 5 6", "3", [
    { input: "5\n2 3 4 5 6", expectedOutput: "3" },
    { input: "4\n1 4 6 8", expectedOutput: "0" },
    { input: "3\n7 11 13", expectedOutput: "3" }
  ]),

  createSeedQuestion(99, "Count how many numbers are divisible by 3 and 5 both.", 4, "Easy", "Given N followed by N integers, count how many numbers are divisible by both 3 and 5.", "5\n15 30 7 10 45", "3", [
    { input: "5\n15 30 7 10 45", expectedOutput: "3" },
    { input: "3\n3 5 9", expectedOutput: "0" },
    { input: "2\n15 30", expectedOutput: "2" }
  ]),

  createSeedQuestion(100, "Count how many elements are perfect squares.", 4, "Medium", "Given N followed by N integers, count how many numbers are perfect squares.", "5\n4 9 10 16 20", "3", [
    { input: "5\n4 9 10 16 20", expectedOutput: "3" },
    { input: "3\n2 3 5", expectedOutput: "0" },
    { input: "4\n1 0 25 36", expectedOutput: "4" }
  ]),

  createSeedQuestion(101, "Create a new array containing squares of all numbers.", 4, "Easy", "Given N followed by N integers, print the squares of each element separated by space.", "4\n1 2 3 4", "1 4 9 16", [
    { input: "4\n1 2 3 4", expectedOutput: "1 4 9 16" },
    { input: "3\n-2 0 3", expectedOutput: "4 0 9" }
  ]),

  createSeedQuestion(102, "Create a new array containing only even elements.", 4, "Easy", "Given N followed by N integers, print only the even elements separated by space.", "5\n1 2 3 4 5", "2 4", [
    { input: "5\n1 2 3 4 5", expectedOutput: "2 4" },
    { input: "3\n1 3 5", expectedOutput: "" },
    { input: "3\n2 4 6", expectedOutput: "2 4 6" }
  ]),

  createSeedQuestion(103, "Replace every negative number with 0.", 4, "Easy", "Given N followed by N integers, replace every negative number with 0 and print the modified array separated by space.", "5\n-1 2 -3 4 0", "0 2 0 4 0", [
    { input: "5\n-1 2 -3 4 0", expectedOutput: "0 2 0 4 0" },
    { input: "3\n-5 -10 -2", expectedOutput: "0 0 0" }
  ]),

  createSeedQuestion(104, "Replace all even numbers with 1 and all odd with 0.", 4, "Easy", "Given N followed by N integers, replace all even numbers with 1 and all odd numbers with 0, then print the array.", "5\n1 2 3 4 5", "0 1 0 1 0", [
    { input: "5\n1 2 3 4 5", expectedOutput: "0 1 0 1 0" },
    { input: "3\n2 4 6", expectedOutput: "1 1 1" }
  ]),

  createSeedQuestion(105, "Swap the first and last elements of the array.", 4, "Easy", "Given N followed by N integers, swap the first and last elements and print the resulting array.", "4\n1 2 3 4", "4 2 3 1", [
    { input: "4\n1 2 3 4", expectedOutput: "4 2 3 1" },
    { input: "2\n10 20", expectedOutput: "20 10" },
    { input: "1\n5", expectedOutput: "5" }
  ]),

  createSeedQuestion(106, "Reverse an array (without using built-in reverse).", 4, "Easy", "Given N followed by N integers, reverse the array and print the elements separated by space.", "4\n1 2 3 4", "4 3 2 1", [
    { input: "4\n1 2 3 4", expectedOutput: "4 3 2 1" },
    { input: "3\n10 20 30", expectedOutput: "30 20 10" },
    { input: "1\n9", expectedOutput: "9" }
  ]),

  createSeedQuestion(107, "Rotate an array by one position to the left.", 4, "Medium", "Given N followed by N integers, rotate the array left by one position (first element moves to the end) and print it.", "4\n1 2 3 4", "2 3 4 1", [
    { input: "4\n1 2 3 4", expectedOutput: "2 3 4 1" },
    { input: "3\n10 20 30", expectedOutput: "20 30 10" }
  ]),

  createSeedQuestion(108, "Rotate an array by one position to the right.", 4, "Medium", "Given N followed by N integers, rotate the array right by one position (last element moves to the front) and print it.", "4\n1 2 3 4", "4 1 2 3", [
    { input: "4\n1 2 3 4", expectedOutput: "4 1 2 3" },
    { input: "3\n10 20 30", expectedOutput: "30 10 20" }
  ]),

  createSeedQuestion(109, "Swap alternate elements (1st ↔ 2nd, 3rd ↔ 4th, etc.).", 4, "Medium", "Given N followed by N integers, swap alternate elements (1st with 2nd, 3rd with 4th, etc.) and print the array.", "4\n1 2 3 4", "2 1 4 3", [
    { input: "4\n1 2 3 4", expectedOutput: "2 1 4 3" },
    { input: "5\n1 2 3 4 5", expectedOutput: "2 1 4 3 5" }
  ]),

  createSeedQuestion(110, "Copy one array to another manually.", 4, "Easy", "Given N followed by N integers, copy all elements to a new array and print them.", "3\n5 10 15", "5 10 15", [
    { input: "3\n5 10 15", expectedOutput: "5 10 15" },
    { input: "1\n42", expectedOutput: "42" }
  ]),

  createSeedQuestion(111, "Compare two arrays — check if they are equal (same elements & order).", 4, "Medium", "Given two arrays (N followed by N elements, then M followed by M elements), check if they are identical in size, elements, and order. Print 'Yes' or 'No'.", "3\n1 2 3\n3\n1 2 3", "Yes", [
    { input: "3\n1 2 3\n3\n1 2 3", expectedOutput: "Yes" },
    { input: "3\n1 2 3\n3\n1 3 2", expectedOutput: "No" },
    { input: "2\n1 2\n3\n1 2 3", expectedOutput: "No" }
  ]),

  createSeedQuestion(112, "Compare two arrays — check if they contain the same elements (ignore order).", 4, "Hard", "Given two arrays, check if they contain the exact same set of elements with identical frequencies, ignoring order. Print 'Yes' or 'No'.", "3\n1 2 3\n3\n3 1 2", "Yes", [
    { input: "3\n1 2 3\n3\n3 1 2", expectedOutput: "Yes" },
    { input: "3\n1 2 3\n3\n1 2 4", expectedOutput: "No" },
    { input: "2\n1 2\n2\n2 1", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(113, "Merge two arrays into a third array.", 4, "Easy", "Given two arrays (N followed by N elements, then M followed by M elements), merge them into a single sequence and print.", "3\n1 2 3\n2\n4 5", "1 2 3 4 5", [
    { input: "3\n1 2 3\n2\n4 5", expectedOutput: "1 2 3 4 5" },
    { input: "1\n10\n1\n20", expectedOutput: "10 20" }
  ]),

  createSeedQuestion(114, "Find the common elements between two arrays.", 4, "Hard", "Given two arrays, find all distinct elements present in both arrays and print them in ascending order.", "4\n1 2 3 4\n3\n3 4 5", "3 4", [
    { input: "4\n1 2 3 4\n3\n3 4 5", expectedOutput: "3 4" },
    { input: "2\n1 2\n2\n3 4", expectedOutput: "" },
    { input: "3\n10 20 30\n3\n30 20 10", expectedOutput: "10 20 30" }
  ]),

  createSeedQuestion(115, "Find elements that are in one array but not in the other.", 4, "Hard", "Given array A followed by array B, print elements present in A but not in B (unique, in order of appearance in A).", "4\n1 2 3 4\n2\n3 4", "1 2", [
    { input: "4\n1 2 3 4\n2\n3 4", expectedOutput: "1 2" },
    { input: "3\n1 2 3\n3\n1 2 3", expectedOutput: "" },
    { input: "3\n5 10 15\n1\n20", expectedOutput: "5 10 15" }
  ]),

  createSeedQuestion(116, "Count how many elements are common between two arrays.", 4, "Medium", "Given two arrays, count how many distinct elements are common to both arrays.", "4\n1 2 3 4\n3\n3 4 5", "2", [
    { input: "4\n1 2 3 4\n3\n3 4 5", expectedOutput: "2" },
    { input: "2\n1 2\n2\n3 4", expectedOutput: "0" }
  ]),

  createSeedQuestion(117, "Find element-wise sum of two arrays (A[i] + B[i]).", 4, "Easy", "Given two arrays of same size N, print their element-wise sum A[i] + B[i] separated by space.", "3\n1 2 3\n3\n4 5 6", "5 7 9", [
    { input: "3\n1 2 3\n3\n4 5 6", expectedOutput: "5 7 9" },
    { input: "2\n10 20\n2\n-5 5", expectedOutput: "5 25" }
  ]),

  createSeedQuestion(118, "Find element-wise product of two arrays.", 4, "Easy", "Given two arrays of same size N, print their element-wise product A[i] * B[i] separated by space.", "3\n1 2 3\n3\n4 5 6", "4 10 18", [
    { input: "3\n1 2 3\n3\n4 5 6", expectedOutput: "4 10 18" },
    { input: "2\n2 5\n2\n3 4", expectedOutput: "6 20" }
  ]),

  createSeedQuestion(119, "Create a frequency array of numbers (count occurrence of each number).", 4, "Medium", "Given N followed by N integers, print the frequency of each element in sorted order of elements, format 'elem: count' per line.", "5\n1 2 2 3 1", "1: 2\n2: 2\n3: 1", [
    { input: "5\n1 2 2 3 1", expectedOutput: "1: 2\n2: 2\n3: 1" },
    { input: "3\n5 5 5", expectedOutput: "5: 3" }
  ]),

  createSeedQuestion(120, "Print all elements that appear more than once.", 4, "Hard", "Given N followed by N integers, print all elements that appear more than once in ascending order separated by space.", "6\n1 2 3 2 4 1", "1 2", [
    { input: "6\n1 2 3 2 4 1", expectedOutput: "1 2" },
    { input: "4\n1 2 3 4", expectedOutput: "" },
    { input: "4\n9 9 9 9", expectedOutput: "9" }
  ]),

  createSeedQuestion(121, "Check if the array is sorted in ascending order.", 4, "Easy", "Check if the given array of integers is sorted in non-decreasing (ascending) order. Print 'Yes' or 'No'.", "4\n1 2 3 4", "Yes", [
    { input: "4\n1 2 3 4", expectedOutput: "Yes" },
    { input: "4\n1 3 2 4", expectedOutput: "No" },
    { input: "3\n2 2 2", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(122, "Check if the array is sorted in descending order.", 4, "Easy", "Check if the given array of integers is sorted in non-increasing (descending) order. Print 'Yes' or 'No'.", "4\n4 3 2 1", "Yes", [
    { input: "4\n4 3 2 1", expectedOutput: "Yes" },
    { input: "4\n4 2 3 1", expectedOutput: "No" },
    { input: "1\n5", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(123, "Find the second largest element in an array.", 4, "Medium", "Given N (>= 2) followed by N integers, find the second largest distinct element. If no second largest exists, print -1.", "5\n10 20 4 45 99", "45", [
    { input: "5\n10 20 4 45 99", expectedOutput: "45" },
    { input: "3\n10 10 10", expectedOutput: "-1" },
    { input: "4\n5 1 5 3", expectedOutput: "3" }
  ]),

  createSeedQuestion(124, "Find the second smallest element in an array.", 4, "Medium", "Given N (>= 2) followed by N integers, find the second smallest distinct element. If none exists, print -1.", "5\n10 20 4 45 99", "10", [
    { input: "5\n10 20 4 45 99", expectedOutput: "10" },
    { input: "3\n5 5 5", expectedOutput: "-1" },
    { input: "3\n1 2 3", expectedOutput: "2" }
  ]),

  createSeedQuestion(125, "Find the difference between the largest and smallest element.", 4, "Easy", "Given N followed by N integers, find the absolute difference between the largest and smallest element.", "5\n10 20 4 45 99", "95", [
    { input: "5\n10 20 4 45 99", expectedOutput: "95" },
    { input: "3\n5 5 5", expectedOutput: "0" },
    { input: "2\n-10 10", expectedOutput: "20" }
  ]),

  createSeedQuestion(126, "Find the sum of all elements except the largest and smallest.", 4, "Medium", "Given N followed by N integers, find the sum of all elements excluding the maximum and minimum elements.", "5\n1 2 3 4 5", "9", [
    { input: "5\n1 2 3 4 5", expectedOutput: "9" },
    { input: "4\n10 20 30 40", expectedOutput: "50" }
  ]),

  createSeedQuestion(127, "Count how many pairs of elements have a sum equal to a given number k.", 4, "Hard", "Given N followed by N integers on line 2, and integer K on line 3, count how many pairs (i < j) satisfy A[i] + A[j] = K.", "5\n1 5 7 -1 5\n6", "3", [
    { input: "5\n1 5 7 -1 5\n6", expectedOutput: "3" },
    { input: "4\n1 2 3 4\n5", expectedOutput: "2" },
    { input: "3\n1 1 1\n2", expectedOutput: "3" }
  ]),

  createSeedQuestion(128, "Count how many elements are greater than the average of the array.", 4, "Medium", "Given N followed by N integers, count how many elements are strictly greater than the average of the array.", "5\n1 2 3 4 5", "2", [
    { input: "5\n1 2 3 4 5", expectedOutput: "2" },
    { input: "4\n2 2 2 2", expectedOutput: "0" },
    { input: "3\n10 20 60", expectedOutput: "1" }
  ]),

  createSeedQuestion(129, "Print the frequency of each distinct element.", 4, "Medium", "Given N followed by N integers, print each distinct element in order of appearance followed by its frequency in format 'elem: count'.", "5\n1 2 2 3 3", "1: 1\n2: 2\n3: 2", [
    { input: "5\n1 2 2 3 3", expectedOutput: "1: 1\n2: 2\n3: 2" },
    { input: "4\n7 7 8 7", expectedOutput: "7: 3\n8: 1" }
  ]),

  createSeedQuestion(130, "Print all unique elements (those that occur exactly once).", 4, "Hard", "Given N followed by N integers, print all unique elements (occurring exactly once) in ascending order separated by space.", "5\n1 2 2 3 4", "1 3 4", [
    { input: "5\n1 2 2 3 4", expectedOutput: "1 3 4" },
    { input: "4\n5 5 6 6", expectedOutput: "" },
    { input: "3\n9 8 7", expectedOutput: "7 8 9" }
  ])];
