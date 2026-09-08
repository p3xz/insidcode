const fs = require('fs');
const path = require('path');
const { allMeta, generateQuestionCode, fileHeader, fileFooter } = require('./curriculum_builder_utils');

const stringSpecs = {
  131: {
    desc: "Take a string input and print its total length.",
    in: "insidcode", out: "9",
    tests: [{ input: "insidcode", output: "9" }, { input: "hello world", output: "11" }, { input: "", output: "0" }]
  },
  132: {
    desc: "Take a non-empty string and print the first and last character separated by space.",
    in: "developer", out: "d r",
    tests: [{ input: "developer", output: "d r" }, { input: "code", output: "c e" }, { input: "a", output: "a a" }]
  },
  133: {
    desc: "Take a string and convert all characters to uppercase.",
    in: "hello", out: "HELLO",
    tests: [{ input: "hello", output: "HELLO" }, { input: "insidcode", output: "INSIDCODE" }]
  },
  134: {
    desc: "Take a string and convert all characters to lowercase.",
    in: "HELLO", out: "hello",
    tests: [{ input: "HELLO", output: "hello" }, { input: "InsidCode", output: "insidcode" }]
  },
  135: {
    desc: "Take a string and count how many characters it contains, excluding spaces.",
    in: "hello world", out: "10",
    tests: [{ input: "hello world", output: "10" }, { input: "a b c", output: "3" }, { input: "no_spaces", output: "9" }]
  },
  136: {
    desc: "Take a sentence string and count how many words it contains.",
    in: "Coding is fun", out: "3",
    tests: [{ input: "Coding is fun", output: "3" }, { input: "SingleWord", output: "1" }, { input: "One two three four", output: "4" }]
  },
  137: {
    desc: "Take two strings on separate lines and print them concatenated together.",
    in: "Hello\nWorld", out: "HelloWorld",
    tests: [{ input: "Hello\nWorld", output: "HelloWorld" }, { input: "insid\ncode", output: "insidcode" }]
  },
  138: {
    desc: "Compare two strings S1 and S2 on separate lines lexicographically. Print 'First' if S1 < S2, 'Second' if S1 > S2, or 'Equal' if S1 == S2.",
    in: "apple\nbanana", out: "First",
    tests: [{ input: "apple\nbanana", output: "First" }, { input: "zebra\napple", output: "Second" }, { input: "same\nsame", output: "Equal" }]
  },
  139: {
    desc: "Take a string and print the ASCII value of each character separated by space.",
    in: "ABC", out: "65 66 67",
    tests: [{ input: "ABC", output: "65 66 67" }, { input: "a b", output: "97 32 98" }]
  },
  140: {
    desc: "Check whether a given string is empty (length 0). Print 'Empty' or 'Not Empty'.",
    in: "hello", out: "Not Empty",
    tests: [{ input: "hello", output: "Not Empty" }, { input: "", output: "Empty" }]
  },
  141: {
    desc: "Take an alphabet string and print the count of vowels and consonants in format 'Vowels: V, Consonants: C'.",
    in: "apple", out: "Vowels: 2, Consonants: 3",
    tests: [{ input: "apple", output: "Vowels: 2, Consonants: 3" }, { input: "sky", output: "Vowels: 0, Consonants: 3" }, { input: "aeiou", output: "Vowels: 5, Consonants: 0" }]
  },
  142: {
    desc: "Take a string and print count of letters, digits, and special characters in format 'Letters: L, Digits: D, Special: S'.",
    in: "a1!b2@", out: "Letters: 2, Digits: 2, Special: 2",
    tests: [{ input: "a1!b2@", output: "Letters: 2, Digits: 2, Special: 2" }, { input: "Code123", output: "Letters: 4, Digits: 3, Special: 0" }]
  },
  143: {
    desc: "Take a string and count uppercase and lowercase letters in format 'Uppercase: U, Lowercase: L'.",
    in: "HeLLo", out: "Uppercase: 3, Lowercase: 2",
    tests: [{ input: "HeLLo", output: "Uppercase: 3, Lowercase: 2" }, { input: "abc", output: "Uppercase: 0, Lowercase: 3" }, { input: "XYZ", output: "Uppercase: 3, Lowercase: 0" }]
  },
  144: {
    desc: "Print the frequency of each unique character in order of appearance in format 'char: count' on separate lines.",
    in: "banana", out: "b: 1\na: 3\nn: 2",
    tests: [{ input: "banana", output: "b: 1\na: 3\nn: 2" }, { input: "test", output: "t: 2\ne: 1\ns: 1" }]
  },
  145: {
    desc: "Take a sentence and count how many space characters it contains.",
    in: "Hello there friend", out: "2",
    tests: [{ input: "Hello there friend", output: "2" }, { input: "nospaces", output: "0" }]
  },
  146: {
    desc: "Given string S on line 1 and character C on line 2, count how many times C appears in S.",
    in: "banana\na", out: "3",
    tests: [{ input: "banana\na", output: "3" }, { input: "apple\nz", output: "0" }]
  },
  147: {
    desc: "Take a lowercase alphabetic string and count letters before 'm' and letters after 'm' (excluding 'm') in format 'Before: B, After: A'.",
    in: "lemon", out: "Before: 2, After: 2",
    tests: [{ input: "lemon", output: "Before: 2, After: 2" }, { input: "abc", output: "Before: 3, After: 0" }, { input: "xyz", output: "Before: 0, After: 3" }]
  },
  148: {
    desc: "Count how many non-empty substrings begin and end with the exact same character.",
    in: "aba", out: "4",
    tests: [{ input: "aba", output: "4" }, { input: "abc", output: "3" }, { input: "aaaa", output: "10" }]
  },
  149: {
    desc: "Given a sentence, count how many words start with a vowel (case-insensitive).",
    in: "An apple a day keeps the doctor away", out: "4",
    tests: [{ input: "An apple a day keeps the doctor away", output: "4" }, { input: "hello world", output: "0" }]
  },
  150: {
    desc: "Given a sentence, count how many words end with the letter 's' (case-insensitive).",
    in: "cats dogs and birds", out: "3",
    tests: [{ input: "cats dogs and birds", output: "3" }, { input: "apple orange", output: "0" }]
  },
  151: {
    desc: "Reverse a string without using built-in reverse functions.",
    in: "hello", out: "olleh",
    tests: [{ input: "hello", output: "olleh" }, { input: "world", output: "dlrow" }, { input: "a", output: "a" }]
  },
  152: {
    desc: "Given a sentence, reverse each individual word while preserving word order.",
    in: "hello world", out: "olleh dlrow",
    tests: [{ input: "hello world", output: "olleh dlrow" }, { input: "abc def", output: "cba fed" }]
  },
  153: {
    desc: "Given a sentence, reverse the order of words.",
    in: "hello world", out: "world hello",
    tests: [{ input: "hello world", output: "world hello" }, { input: "one two three", output: "three two one" }]
  },
  154: {
    desc: "Check whether a given string is a palindrome. Print 'Yes' or 'No'.",
    in: "racecar", out: "Yes",
    tests: [{ input: "racecar", output: "Yes" }, { input: "coding", output: "No" }, { input: "noon", output: "Yes" }]
  },
  155: {
    desc: "Given two strings on separate lines, check if one is the exact reverse of the other. Print 'Yes' or 'No'.",
    in: "abc\ncba", out: "Yes",
    tests: [{ input: "abc\ncba", output: "Yes" }, { input: "cat\nact", output: "No" }]
  },
  156: {
    desc: "Print the middle character of a string (if odd length) or middle two characters (if even length).",
    in: "coder", out: "d",
    tests: [{ input: "coder", output: "d" }, { input: "code", output: "od" }]
  },
  157: {
    desc: "Print the second half of the string in reverse order.",
    in: "abcdef", out: "fed",
    tests: [{ input: "abcdef", output: "fed" }, { input: "abcde", output: "ed" }]
  },
  158: {
    desc: "Remove the first and last character of a string and print the remainder.",
    in: "insidcode", out: "nsidcod",
    tests: [{ input: "insidcode", output: "nsidcod" }, { input: "abc", output: "b" }]
  },
  159: {
    desc: "Reverse only alphabetic letters in the string while keeping digits in their original positions.",
    in: "a1b2c", out: "c1b2a",
    tests: [{ input: "a1b2c", output: "c1b2a" }, { input: "123", output: "123" }]
  },
  160: {
    desc: "Reverse all characters in a sentence while preserving the spaces in their original positions.",
    in: "abc de", out: "edc ba",
    tests: [{ input: "abc de", output: "edc ba" }, { input: "a b c", output: "c b a" }]
  },
  161: {
    desc: "Remove all vowels (a, e, i, o, u, case-insensitive) from a string and print the result.",
    in: "insidcode", out: "nsdcd",
    tests: [{ input: "insidcode", output: "nsdcd" }, { input: "apple", output: "ppl" }, { input: "aeiou", output: "" }]
  },
  162: {
    desc: "Remove all whitespace characters from a string and print the result.",
    in: "hello world", out: "helloworld",
    tests: [{ input: "hello world", output: "helloworld" }, { input: " a b c ", output: "abc" }]
  },
  163: {
    desc: "Replace all vowels in a string with '*' and print the result.",
    in: "banana", out: "b*n*n*",
    tests: [{ input: "banana", output: "b*n*n*" }, { input: "code", output: "c*d*" }]
  },
  164: {
    desc: "Replace all spaces in a string with '_' and print the result.",
    in: "hello world", out: "hello_world",
    tests: [{ input: "hello world", output: "hello_world" }, { input: "insid code app", output: "insid_code_app" }]
  },
  165: {
    desc: "Remove all numeric digits (0-9) from a string and print the result.",
    in: "code123app4", out: "codeapp",
    tests: [{ input: "code123app4", output: "codeapp" }, { input: "2026", output: "" }]
  },
  166: {
    desc: "Remove duplicate characters from a string so each appears only once, preserving first occurrence.",
    in: "banana", out: "ban",
    tests: [{ input: "banana", output: "ban" }, { input: "mississippi", output: "misp" }]
  },
  167: {
    desc: "Keep only the first occurrence of each character in a string and print.",
    in: "programming", out: "progami",
    tests: [{ input: "programming", output: "progami" }, { input: "hello", output: "helo" }]
  },
  168: {
    desc: "Remove adjacent consecutive duplicate characters (e.g., 'aaabb' becomes 'ab').",
    in: "aaabbcddd", out: "abcd",
    tests: [{ input: "aaabbcddd", output: "abcd" }, { input: "aabbcc", output: "abc" }]
  },
  169: {
    desc: "Swap case of each letter: uppercase to lowercase, and lowercase to uppercase.",
    in: "Hello World", out: "hELLO wORLD",
    tests: [{ input: "Hello World", output: "hELLO wORLD" }, { input: "ABC", output: "abc" }]
  },
  170: {
    desc: "Shift each alphabetic letter forward by 1 in the alphabet (z wraps to a, Z wraps to A).",
    in: "abcXYZ", out: "bcdYZA",
    tests: [{ input: "abcXYZ", output: "bcdYZA" }, { input: "zebra", output: "afbsb" }]
  },
  171: {
    desc: "Given a sentence, print each word on a new line.",
    in: "Learn logic daily", out: "Learn\nlogic\ndaily",
    tests: [{ input: "Learn logic daily", output: "Learn\nlogic\ndaily" }, { input: "Hello", output: "Hello" }]
  },
  172: {
    desc: "Given a sentence, count how many words have an even number of characters.",
    in: "This is a great day", out: "3",
    tests: [{ input: "This is a great day", output: "3" }, { input: "one two three", output: "0" }]
  },
  173: {
    desc: "Given a sentence, find and print the word with the longest length.",
    in: "Programming with insidcode", out: "Programming",
    tests: [{ input: "Programming with insidcode", output: "Programming" }, { input: "a bb ccc", output: "ccc" }]
  },
  174: {
    desc: "Given a sentence, find and print the word with the shortest length.",
    in: "Learn to build fast", out: "to",
    tests: [{ input: "Learn to build fast", output: "to" }, { input: "big elephant", output: "big" }]
  },
  175: {
    desc: "Given a sentence, swap the first and last words and print the modified sentence.",
    in: "Start coding right now", out: "now coding right Start",
    tests: [{ input: "Start coding right now", output: "now coding right Start" }, { input: "hello world", output: "world hello" }]
  },
  176: {
    desc: "Given a sentence, print all words that start and end with the same letter (case-insensitive) separated by space.",
    in: "noon radar apple level deed", out: "noon radar level deed",
    tests: [{ input: "noon radar apple level deed", output: "noon radar level deed" }, { input: "cat dog", output: "" }]
  },
  177: {
    desc: "Given a sentence, count how many words contain the letter 'a' (case-insensitive).",
    in: "An apple a day keeps the doctor away", out: "5",
    tests: [{ input: "An apple a day keeps the doctor away", output: "5" }, { input: "hello world", output: "0" }]
  },
  178: {
    desc: "Given a sentence, capitalize the first letter of each word and print.",
    in: "insidcode logic builder", out: "Insidcode Logic Builder",
    tests: [{ input: "insidcode logic builder", output: "Insidcode Logic Builder" }, { input: "hello", output: "Hello" }]
  },
  179: {
    desc: "Convert a sentence to Title Case (first letter of each word uppercase, all subsequent letters lowercase).",
    in: "hELLO wORLD oF cODING", out: "Hello World Of Coding",
    tests: [{ input: "hELLO wORLD oF cODING", output: "Hello World Of Coding" }]
  },
  180: {
    desc: "Remove multiple contiguous spaces between words and trim leading/trailing whitespace (normalize spacing to single spaces).",
    in: "   Learn    to   code   well   ", out: "Learn to code well",
    tests: [{ input: "   Learn    to   code   well   ", output: "Learn to code well" }, { input: "a  b", output: "a b" }]
  }
};

const pieces = [];
for (let id = 131; id <= 180; id++) {
  const meta = allMeta[id];
  const spec = stringSpecs[id];
  if (!meta || !spec) {
    console.error('Missing spec for string question', id);
    process.exit(1);
  }
  pieces.push(generateQuestionCode(meta, 5, spec.desc, spec.in, spec.out, spec.tests));
}

const outContent = fileHeader('CURRICULUM_STRINGS') + pieces.join(',\n\n') + fileFooter();
const targetPath = path.join(__dirname, '..', 'src', 'lib', 'curriculumDataStrings.ts');
fs.writeFileSync(targetPath, outContent, 'utf8');
console.log(`Generated ${targetPath} with ${pieces.length} questions.`);
