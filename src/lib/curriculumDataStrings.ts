import { QuestionSeedItem, createSeedQuestion } from "./curriculumData";

export const CURRICULUM_STRINGS: QuestionSeedItem[] = [
  createSeedQuestion(131, "Take a string input and print its length.", 5, "Easy", "Take a string input and print its total length.", "insidcode", "9", [
    { input: "insidcode", expectedOutput: "9" },
    { input: "hello world", expectedOutput: "11" },
    { input: "", expectedOutput: "0" }
  ]),

  createSeedQuestion(132, "Print the first and last character of a string.", 5, "Easy", "Take a non-empty string and print the first and last character separated by space.", "developer", "d r", [
    { input: "developer", expectedOutput: "d r" },
    { input: "code", expectedOutput: "c e" },
    { input: "a", expectedOutput: "a a" }
  ]),

  createSeedQuestion(133, "Convert all characters of a string to uppercase.", 5, "Easy", "Take a string and convert all characters to uppercase.", "hello", "HELLO", [
    { input: "hello", expectedOutput: "HELLO" },
    { input: "insidcode", expectedOutput: "INSIDCODE" }
  ]),

  createSeedQuestion(134, "Convert all characters of a string to lowercase.", 5, "Easy", "Take a string and convert all characters to lowercase.", "HELLO", "hello", [
    { input: "HELLO", expectedOutput: "hello" },
    { input: "InsidCode", expectedOutput: "insidcode" }
  ]),

  createSeedQuestion(135, "Count how many characters (excluding spaces) are in the string.", 5, "Easy", "Take a string and count how many characters it contains, excluding spaces.", "hello world", "10", [
    { input: "hello world", expectedOutput: "10" },
    { input: "a b c", expectedOutput: "3" },
    { input: "no_spaces", expectedOutput: "9" }
  ]),

  createSeedQuestion(136, "Count how many words are in a sentence.", 5, "Easy", "Take a sentence string and count how many words it contains.", "Coding is fun", "3", [
    { input: "Coding is fun", expectedOutput: "3" },
    { input: "SingleWord", expectedOutput: "1" },
    { input: "One two three four", expectedOutput: "4" }
  ]),

  createSeedQuestion(137, "Take two strings and print them concatenated.", 5, "Easy", "Take two strings on separate lines and print them concatenated together.", "Hello\nWorld", "HelloWorld", [
    { input: "Hello\nWorld", expectedOutput: "HelloWorld" },
    { input: "insid\ncode", expectedOutput: "insidcode" }
  ]),

  createSeedQuestion(138, "Compare two strings lexicographically (like dictionary order).", 5, "Medium", "Compare two strings S1 and S2 on separate lines lexicographically. Print 'First' if S1 < S2, 'Second' if S1 > S2, or 'Equal' if S1 == S2.", "apple\nbanana", "First", [
    { input: "apple\nbanana", expectedOutput: "First" },
    { input: "zebra\napple", expectedOutput: "Second" },
    { input: "same\nsame", expectedOutput: "Equal" }
  ]),

  createSeedQuestion(139, "Print the ASCII value of each character in a string.", 5, "Easy", "Take a string and print the ASCII value of each character separated by space.", "ABC", "65 66 67", [
    { input: "ABC", expectedOutput: "65 66 67" },
    { input: "a b", expectedOutput: "97 32 98" }
  ]),

  createSeedQuestion(140, "Check whether the string is empty or not.", 5, "Easy", "Check whether a given string is empty (length 0). Print 'Empty' or 'Not Empty'.", "hello", "Not Empty", [
    { input: "hello", expectedOutput: "Not Empty" },
    { input: "", expectedOutput: "Empty" }
  ]),

  createSeedQuestion(141, "Count how many vowels and consonants are in a string.", 5, "Easy", "Take an alphabet string and print the count of vowels and consonants in format 'Vowels: V, Consonants: C'.", "apple", "Vowels: 2, Consonants: 3", [
    { input: "apple", expectedOutput: "Vowels: 2, Consonants: 3" },
    { input: "sky", expectedOutput: "Vowels: 0, Consonants: 3" },
    { input: "aeiou", expectedOutput: "Vowels: 5, Consonants: 0" }
  ]),

  createSeedQuestion(142, "Count the number of digits, letters, and special characters in a string.", 5, "Medium", "Take a string and print count of letters, digits, and special characters in format 'Letters: L, Digits: D, Special: S'.", "a1!b2@", "Letters: 2, Digits: 2, Special: 2", [
    { input: "a1!b2@", expectedOutput: "Letters: 2, Digits: 2, Special: 2" },
    { input: "Code123", expectedOutput: "Letters: 4, Digits: 3, Special: 0" }
  ]),

  createSeedQuestion(143, "Count how many uppercase and lowercase letters a string has.", 5, "Easy", "Take a string and count uppercase and lowercase letters in format 'Uppercase: U, Lowercase: L'.", "HeLLo", "Uppercase: 3, Lowercase: 2", [
    { input: "HeLLo", expectedOutput: "Uppercase: 3, Lowercase: 2" },
    { input: "abc", expectedOutput: "Uppercase: 0, Lowercase: 3" },
    { input: "XYZ", expectedOutput: "Uppercase: 3, Lowercase: 0" }
  ]),

  createSeedQuestion(144, "Find the frequency of each character in a string (without using a map).", 5, "Hard", "Print the frequency of each unique character in order of appearance in format 'char: count' on separate lines.", "banana", "b: 1\na: 3\nn: 2", [
    { input: "banana", expectedOutput: "b: 1\na: 3\nn: 2" },
    { input: "test", expectedOutput: "t: 2\ne: 1\ns: 1" }
  ]),

  createSeedQuestion(145, "Count how many spaces are there in a sentence.", 5, "Easy", "Take a sentence and count how many space characters it contains.", "Hello there friend", "2", [
    { input: "Hello there friend", expectedOutput: "2" },
    { input: "nospaces", expectedOutput: "0" }
  ]),

  createSeedQuestion(146, "Count how many times a given character appears in a string.", 5, "Easy", "Given string S on line 1 and character C on line 2, count how many times C appears in S.", "banana\na", "3", [
    { input: "banana\na", expectedOutput: "3" },
    { input: "apple\nz", expectedOutput: "0" }
  ]),

  createSeedQuestion(147, "Count how many alphabets are before 'm' and after 'm' in a given string.", 5, "Medium", "Take a lowercase alphabetic string and count letters before 'm' and letters after 'm' (excluding 'm') in format 'Before: B, After: A'.", "lemon", "Before: 2, After: 2", [
    { input: "lemon", expectedOutput: "Before: 2, After: 2" },
    { input: "abc", expectedOutput: "Before: 3, After: 0" },
    { input: "xyz", expectedOutput: "Before: 0, After: 3" }
  ]),

  createSeedQuestion(148, "Count how many substrings start and end with the same character (simple logic).", 5, "Hard", "Count how many non-empty substrings begin and end with the exact same character.", "aba", "4", [
    { input: "aba", expectedOutput: "4" },
    { input: "abc", expectedOutput: "3" },
    { input: "aaaa", expectedOutput: "10" }
  ]),

  createSeedQuestion(149, "Print how many words start with a vowel in a sentence.", 5, "Medium", "Given a sentence, count how many words start with a vowel (case-insensitive).", "An apple a day keeps the doctor away", "4", [
    { input: "An apple a day keeps the doctor away", expectedOutput: "4" },
    { input: "hello world", expectedOutput: "0" }
  ]),

  createSeedQuestion(150, "Count how many words end with 's'.", 5, "Medium", "Given a sentence, count how many words end with the letter 's' (case-insensitive).", "cats dogs and birds", "3", [
    { input: "cats dogs and birds", expectedOutput: "3" },
    { input: "apple orange", expectedOutput: "0" }
  ]),

  createSeedQuestion(151, "Reverse a string without using built-in reverse.", 5, "Easy", "Reverse a string without using built-in reverse functions.", "hello", "olleh", [
    { input: "hello", expectedOutput: "olleh" },
    { input: "world", expectedOutput: "dlrow" },
    { input: "a", expectedOutput: "a" }
  ]),

  createSeedQuestion(152, "Reverse each word in a sentence.", 5, "Medium", "Given a sentence, reverse each individual word while preserving word order.", "hello world", "olleh dlrow", [
    { input: "hello world", expectedOutput: "olleh dlrow" },
    { input: "abc def", expectedOutput: "cba fed" }
  ]),

  createSeedQuestion(153, "Reverse the order of words in a sentence.", 5, "Medium", "Given a sentence, reverse the order of words.", "hello world", "world hello", [
    { input: "hello world", expectedOutput: "world hello" },
    { input: "one two three", expectedOutput: "three two one" }
  ]),

  createSeedQuestion(154, "Check whether a string is a palindrome.", 5, "Easy", "Check whether a given string is a palindrome. Print 'Yes' or 'No'.", "racecar", "Yes", [
    { input: "racecar", expectedOutput: "Yes" },
    { input: "coding", expectedOutput: "No" },
    { input: "noon", expectedOutput: "Yes" }
  ]),

  createSeedQuestion(155, "Check if two strings are the reverse of each other.", 5, "Medium", "Given two strings on separate lines, check if one is the exact reverse of the other. Print 'Yes' or 'No'.", "abc\ncba", "Yes", [
    { input: "abc\ncba", expectedOutput: "Yes" },
    { input: "cat\nact", expectedOutput: "No" }
  ]),

  createSeedQuestion(156, "Print the middle character(s) of a string.", 5, "Easy", "Print the middle character of a string (if odd length) or middle two characters (if even length).", "coder", "d", [
    { input: "coder", expectedOutput: "d" },
    { input: "code", expectedOutput: "od" }
  ]),

  createSeedQuestion(157, "Print the second half of the string in reverse.", 5, "Medium", "Print the second half of the string in reverse order.", "abcdef", "fed", [
    { input: "abcdef", expectedOutput: "fed" },
    { input: "abcde", expectedOutput: "ed" }
  ]),

  createSeedQuestion(158, "Remove the first and last character and print the remaining string.", 5, "Easy", "Remove the first and last character of a string and print the remainder.", "insidcode", "nsidcod", [
    { input: "insidcode", expectedOutput: "nsidcod" },
    { input: "abc", expectedOutput: "b" }
  ]),

  createSeedQuestion(159, "Reverse only characters, keeping digits in place.", 5, "Hard", "Reverse only alphabetic letters in the string while keeping digits in their original positions.", "a1b2c", "c1b2a", [
    { input: "a1b2c", expectedOutput: "c1b2a" },
    { input: "123", expectedOutput: "123" }
  ]),

  createSeedQuestion(160, "Reverse string but skip spaces.", 5, "Medium", "Reverse all characters in a sentence while preserving the spaces in their original positions.", "abc de", "edc ba", [
    { input: "abc de", expectedOutput: "edc ba" },
    { input: "a b c", expectedOutput: "c b a" }
  ]),

  createSeedQuestion(161, "Remove all vowels from a string.", 5, "Easy", "Remove all vowels (a, e, i, o, u, case-insensitive) from a string and print the result.", "insidcode", "nsdcd", [
    { input: "insidcode", expectedOutput: "nsdcd" },
    { input: "apple", expectedOutput: "ppl" },
    { input: "aeiou", expectedOutput: "" }
  ]),

  createSeedQuestion(162, "Remove all spaces from a string.", 5, "Easy", "Remove all whitespace characters from a string and print the result.", "hello world", "helloworld", [
    { input: "hello world", expectedOutput: "helloworld" },
    { input: " a b c ", expectedOutput: "abc" }
  ]),

  createSeedQuestion(163, "Replace all vowels with '*'.", 5, "Easy", "Replace all vowels in a string with '*' and print the result.", "banana", "b*n*n*", [
    { input: "banana", expectedOutput: "b*n*n*" },
    { input: "code", expectedOutput: "c*d*" }
  ]),

  createSeedQuestion(164, "Replace all spaces with '_'.", 5, "Easy", "Replace all spaces in a string with '_' and print the result.", "hello world", "hello_world", [
    { input: "hello world", expectedOutput: "hello_world" },
    { input: "insid code app", expectedOutput: "insid_code_app" }
  ]),

  createSeedQuestion(165, "Print the string after removing all digits.", 5, "Easy", "Remove all numeric digits (0-9) from a string and print the result.", "code123app4", "codeapp", [
    { input: "code123app4", expectedOutput: "codeapp" },
    { input: "2026", expectedOutput: "" }
  ]),

  createSeedQuestion(166, "Remove duplicate characters from a string.", 5, "Hard", "Remove duplicate characters from a string so each appears only once, preserving first occurrence.", "banana", "ban", [
    { input: "banana", expectedOutput: "ban" },
    { input: "mississippi", expectedOutput: "misp" }
  ]),

  createSeedQuestion(167, "Keep only the first occurrence of each character.", 5, "Hard", "Keep only the first occurrence of each character in a string and print.", "programming", "progami", [
    { input: "programming", expectedOutput: "progami" },
    { input: "hello", expectedOutput: "helo" }
  ]),

  createSeedQuestion(168, "Remove consecutive duplicate characters (e.g., \"aaabb\" → \"ab\").", 5, "Medium", "Remove adjacent consecutive duplicate characters (e.g., 'aaabb' becomes 'ab').", "aaabbcddd", "abcd", [
    { input: "aaabbcddd", expectedOutput: "abcd" },
    { input: "aabbcc", expectedOutput: "abc" }
  ]),

  createSeedQuestion(169, "Swap case: uppercase → lowercase and lowercase → uppercase.", 5, "Easy", "Swap case of each letter: uppercase to lowercase, and lowercase to uppercase.", "Hello World", "hELLO wORLD", [
    { input: "Hello World", expectedOutput: "hELLO wORLD" },
    { input: "ABC", expectedOutput: "abc" }
  ]),

  createSeedQuestion(170, "Shift each character by 1 (e.g., \"abc\" → \"bcd\").", 5, "Medium", "Shift each alphabetic letter forward by 1 in the alphabet (z wraps to a, Z wraps to A).", "abcXYZ", "bcdYZA", [
    { input: "abcXYZ", expectedOutput: "bcdYZA" },
    { input: "zebra", expectedOutput: "afbsb" }
  ]),

  createSeedQuestion(171, "Print each word of a sentence on a new line.", 5, "Easy", "Given a sentence, print each word on a new line.", "Learn logic daily", "Learn\nlogic\ndaily", [
    { input: "Learn logic daily", expectedOutput: "Learn\nlogic\ndaily" },
    { input: "Hello", expectedOutput: "Hello" }
  ]),

  createSeedQuestion(172, "Count how many words have even length.", 5, "Easy", "Given a sentence, count how many words have an even number of characters.", "This is a great day", "3", [
    { input: "This is a great day", expectedOutput: "3" },
    { input: "one two three", expectedOutput: "0" }
  ]),

  createSeedQuestion(173, "Find the longest word in a sentence.", 5, "Medium", "Given a sentence, find and print the word with the longest length.", "Programming with insidcode", "Programming", [
    { input: "Programming with insidcode", expectedOutput: "Programming" },
    { input: "a bb ccc", expectedOutput: "ccc" }
  ]),

  createSeedQuestion(174, "Find the shortest word in a sentence.", 5, "Medium", "Given a sentence, find and print the word with the shortest length.", "Learn to build fast", "to", [
    { input: "Learn to build fast", expectedOutput: "to" },
    { input: "big elephant", expectedOutput: "big" }
  ]),

  createSeedQuestion(175, "Swap first and last words in a sentence.", 5, "Medium", "Given a sentence, swap the first and last words and print the modified sentence.", "Start coding right now", "now coding right Start", [
    { input: "Start coding right now", expectedOutput: "now coding right Start" },
    { input: "hello world", expectedOutput: "world hello" }
  ]),

  createSeedQuestion(176, "Print all words that start and end with the same letter.", 5, "Medium", "Given a sentence, print all words that start and end with the same letter (case-insensitive) separated by space.", "noon radar apple level deed", "noon radar level deed", [
    { input: "noon radar apple level deed", expectedOutput: "noon radar level deed" },
    { input: "cat dog", expectedOutput: "" }
  ]),

  createSeedQuestion(177, "Count how many words contain the letter 'a'.", 5, "Easy", "Given a sentence, count how many words contain the letter 'a' (case-insensitive).", "An apple a day keeps the doctor away", "5", [
    { input: "An apple a day keeps the doctor away", expectedOutput: "5" },
    { input: "hello world", expectedOutput: "0" }
  ]),

  createSeedQuestion(178, "Capitalize the first letter of each word.", 5, "Medium", "Given a sentence, capitalize the first letter of each word and print.", "insidcode logic builder", "Insidcode Logic Builder", [
    { input: "insidcode logic builder", expectedOutput: "Insidcode Logic Builder" },
    { input: "hello", expectedOutput: "Hello" }
  ]),

  createSeedQuestion(179, "Print the sentence in title case (first letter capital, rest lowercase).", 5, "Medium", "Convert a sentence to Title Case (first letter of each word uppercase, all subsequent letters lowercase).", "hELLO wORLD oF cODING", "Hello World Of Coding", [
    { input: "hELLO wORLD oF cODING", expectedOutput: "Hello World Of Coding" }
  ]),

  createSeedQuestion(180, "Remove extra spaces between words (normalize spacing).", 5, "Hard", "Remove multiple contiguous spaces between words and trim leading/trailing whitespace (normalize spacing to single spaces).", "   Learn    to   code   well   ", "Learn to code well", [
    { input: "   Learn    to   code   well   ", expectedOutput: "Learn to code well" },
    { input: "a  b", expectedOutput: "a b" }
  ])];
