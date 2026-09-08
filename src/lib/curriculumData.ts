import { DifficultyLevel, ExampleCase, HiddenTestCase, StarterTemplates } from "@/types";
import { generateDefaultStarterTemplates } from "./starterTemplates";

export interface QuestionSeedItem {
  problemId: string;
  title: string;
  slug: string;
  phase: number;
  difficulty: DifficultyLevel;
  description: string;
  constraints: string[];
  examples: ExampleCase[];
  starterTemplates: StarterTemplates;
  tags: string[];
  xp: number;
  hiddenTestCases: HiddenTestCase[];
  isPublished: boolean;
}

export function createSeedQuestion(
  idNum: number,
  title: string,
  phase: number,
  difficulty: DifficultyLevel,
  description: string,
  sampleInput: string,
  sampleOutput: string,
  hiddenTests: HiddenTestCase[],
  constraints: string[] = ["-10^9 <= N <= 10^9"],
  tags: string[] = []
): QuestionSeedItem {
  const problemId = idNum.toString().padStart(3, "0");
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const xp = difficulty === "Hard" ? 30 : difficulty === "Medium" ? 20 : 10;
  const phaseNames = [
    "Conditional Thinking",
    "Looping and Patterns",
    "Recursion",
    "Basic Arrays",
    "Strings",
    "Mixed Logical Challenges",
  ];

  return {
    problemId,
    title,
    slug: `${problemId}-${slug}`,
    phase,
    difficulty,
    description: `${description}\n\nInput Format:\nRead input from standard input (stdin).\n\nOutput Format:\nPrint the result to standard output (stdout).`,
    constraints,
    examples: [
      {
        input: sampleInput,
        output: sampleOutput,
        explanation: `Sample execution for input ${sampleInput || "(no input)"}`,
      },
    ],
    starterTemplates: generateDefaultStarterTemplates(title),
    tags: [phaseNames[phase - 1], difficulty, ...tags],
    xp,
    hiddenTestCases: hiddenTests.length > 0 ? hiddenTests : [{ input: sampleInput, expectedOutput: sampleOutput }],
    isPublished: true,
  };
}

export const CURRICULUM_QUESTIONS: QuestionSeedItem[] = [
createSeedQuestion(1, "Positive, Negative, or Zero", 1, "Easy", "Take a number and print whether it is 'Positive', 'Negative', or 'Zero'.", "5", "Positive", [
    { input: "5", expectedOutput: "Positive" },
    { input: "-12", expectedOutput: "Negative" },
    { input: "0", expectedOutput: "Zero" },
    { input: "1000", expectedOutput: "Positive" },
  ]),

createSeedQuestion(2, "Even or Odd", 1, "Easy", "Check whether a given integer is 'Even' or 'Odd'.", "4", "Even", [
    { input: "4", expectedOutput: "Even" },
    { input: "7", expectedOutput: "Odd" },
    { input: "0", expectedOutput: "Even" },
    { input: "-5", expectedOutput: "Odd" },
  ]),

createSeedQuestion(3, "Divisible by 5", 1, "Easy", "Check if a number is divisible by 5. Print 'Yes' or 'No'.", "25", "Yes", [
    { input: "25", expectedOutput: "Yes" },
    { input: "14", expectedOutput: "No" },
    { input: "0", expectedOutput: "Yes" },
  ]),

createSeedQuestion(4, "Divisible by Both 3 and 5", 1, "Easy", "Check if a number is divisible by both 3 and 5. Print 'Yes' or 'No'.", "15", "Yes", [
    { input: "15", expectedOutput: "Yes" },
    { input: "9", expectedOutput: "No" },
    { input: "30", expectedOutput: "Yes" },
    { input: "10", expectedOutput: "No" },
  ]),

createSeedQuestion(5, "Leap Year Checker", 1, "Easy", "Check if a given year is a leap year. Print 'Leap Year' or 'Not Leap Year'.", "2024", "Leap Year", [
    { input: "2024", expectedOutput: "Leap Year" },
    { input: "1900", expectedOutput: "Not Leap Year" },
    { input: "2000", expectedOutput: "Leap Year" },
    { input: "2023", expectedOutput: "Not Leap Year" },
  ]),

createSeedQuestion(6, "Larger of Two Numbers", 1, "Easy", "Take two numbers on separate lines and print the larger one.", "10\n20", "20", [
    { input: "10\n20", expectedOutput: "20" },
    { input: "-5\n-10", expectedOutput: "-5" },
    { input: "8\n8", expectedOutput: "8" },
  ]),

createSeedQuestion(7, "Largest of Three Numbers", 1, "Easy", "Take three numbers on separate lines and print the largest one.", "12\n45\n32", "45", [
    { input: "12\n45\n32", expectedOutput: "45" },
    { input: "-1\n-5\n-3", expectedOutput: "-1" },
    { input: "100\n100\n50", expectedOutput: "100" },
  ]),

createSeedQuestion(8, "Temperature Classifier", 1, "Easy", "Take temperature T in Celsius. If T < 15 print 'Cold', if 15 <= T <= 30 print 'Warm', else print 'Hot'.", "22", "Warm", [
    { input: "10", expectedOutput: "Cold" },
    { input: "22", expectedOutput: "Warm" },
    { input: "35", expectedOutput: "Hot" },
    { input: "15", expectedOutput: "Warm" },
  ]),

createSeedQuestion(9, "Vowel or Consonant", 1, "Easy", "Take a single alphabet character and check if it is a 'Vowel' or 'Consonant' (case-insensitive).", "a", "Vowel", [
    { input: "a", expectedOutput: "Vowel" },
    { input: "Z", expectedOutput: "Consonant" },
    { input: "E", expectedOutput: "Vowel" },
    { input: "b", expectedOutput: "Consonant" },
  ]),

createSeedQuestion(10, "Character Classifier", 1, "Easy", "Take a character and print 'Uppercase', 'Lowercase', 'Digit', or 'Special Character'.", "G", "Uppercase", [
    { input: "G", expectedOutput: "Uppercase" },
    { input: "m", expectedOutput: "Lowercase" },
    { input: "7", expectedOutput: "Digit" },
    { input: "#", expectedOutput: "Special Character" },
  ]),

  // Level 2: Nested If & Multiple Conditions (Easy - Medium),

createSeedQuestion(11, "Valid Triangle", 1, "Easy", "Take three sides of a triangle on separate lines and check if they form a valid triangle. Print 'Valid' or 'Invalid'.", "3\n4\n5", "Valid", [
    { input: "3\n4\n5", expectedOutput: "Valid" },
    { input: "1\n2\n3", expectedOutput: "Invalid" },
    { input: "5\n5\n5", expectedOutput: "Valid" },
  ]),

createSeedQuestion(12, "Triangle Type", 1, "Medium", "If three sides form a valid triangle, print 'Equilateral', 'Isosceles', or 'Scalene'. If invalid, print 'Invalid'.", "3\n3\n3", "Equilateral", [
    { input: "3\n3\n3", expectedOutput: "Equilateral" },
    { input: "5\n5\n3", expectedOutput: "Isosceles" },
    { input: "3\n4\n5", expectedOutput: "Scalene" },
    { input: "1\n1\n5", expectedOutput: "Invalid" },
  ]),

createSeedQuestion(13, "Grade Calculator", 1, "Easy", "Take marks (0-100) and print grade: 90-100 'A', 80-89 'B', 70-79 'C', 60-69 'D', below 60 'F'.", "85", "B", [
    { input: "95", expectedOutput: "A" },
    { input: "85", expectedOutput: "B" },
    { input: "72", expectedOutput: "C" },
    { input: "64", expectedOutput: "D" },
    { input: "45", expectedOutput: "F" },
  ]),

createSeedQuestion(14, "Multiple of the Other", 1, "Easy", "Take two positive integers and check if one is a multiple of the other. Print 'Yes' or 'No'.", "6\n3", "Yes", [
    { input: "6\n3", expectedOutput: "Yes" },
    { input: "4\n12", expectedOutput: "Yes" },
    { input: "7\n5", expectedOutput: "No" },
  ]),

createSeedQuestion(15, "Greeting by Hour", 1, "Easy", "Take hour (0-23) and print: 5-11 'Good Morning', 12-16 'Good Afternoon', 17-21 'Good Evening', otherwise 'Good Night'.", "14", "Good Afternoon", [
    { input: "8", expectedOutput: "Good Morning" },
    { input: "14", expectedOutput: "Good Afternoon" },
    { input: "19", expectedOutput: "Good Evening" },
    { input: "23", expectedOutput: "Good Night" },
    { input: "2", expectedOutput: "Good Night" },
  ]),

createSeedQuestion(16, "Voting Eligibility", 1, "Easy", "Given age N, print 'Eligible' if age >= 18, else print 'Not Eligible'.", "19", "Eligible", [
    { input: "19", expectedOutput: "Eligible" },
    { input: "17", expectedOutput: "Not Eligible" },
    { input: "18", expectedOutput: "Eligible" },
  ]),

createSeedQuestion(17, "Parity Comparison", 1, "Easy", "Take two integers. Print 'Both Even', 'Both Odd', or 'One Even One Odd'.", "4\n8", "Both Even", [
    { input: "4\n8", expectedOutput: "Both Even" },
    { input: "3\n7", expectedOutput: "Both Odd" },
    { input: "2\n5", expectedOutput: "One Even One Odd" },
  ]),

createSeedQuestion(18, "Alphabet Half Checker", 1, "Easy", "Take a lowercase letter. Print 'First Half' if between 'a' and 'm', else 'Second Half'.", "f", "First Half", [
    { input: "f", expectedOutput: "First Half" },
    { input: "m", expectedOutput: "First Half" },
    { input: "n", expectedOutput: "Second Half" },
    { input: "z", expectedOutput: "Second Half" },
  ]),

createSeedQuestion(19, "Day Number to Name", 1, "Easy", "Take day number (1-7, where 1=Monday). Print day name. If invalid, print 'Invalid'.", "1", "Monday", [
    { input: "1", expectedOutput: "Monday" },
    { input: "5", expectedOutput: "Friday" },
    { input: "7", expectedOutput: "Sunday" },
    { input: "9", expectedOutput: "Invalid" },
  ]),

createSeedQuestion(20, "Days in Month", 1, "Easy", "Take month number (1-12) and print number of days in that month (non-leap year, Feb=28).", "2", "28", [
    { input: "1", expectedOutput: "31" },
    { input: "2", expectedOutput: "28" },
    { input: "4", expectedOutput: "30" },
    { input: "7", expectedOutput: "31" },
  ]),

  // Level 3: Math and Number Logic (Medium),

createSeedQuestion(21, "Print 1 to 10", 2, "Easy", "Print numbers from 1 to 10, each on a new line.", "", "1\n2\n3\n4\n5\n6\n7\n8\n9\n10", [
    { input: "", expectedOutput: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10" },
  ]),

createSeedQuestion(22, "Even Numbers 1 to 100", 2, "Easy", "Print all even numbers between 1 and 100 inclusive, separated by space.", "", "2 4 6 8 10 12 14 16 18 20 22 24 26 28 30 32 34 36 38 40 42 44 46 48 50 52 54 56 58 60 62 64 66 68 70 72 74 76 78 80 82 84 86 88 90 92 94 96 98 100", [
    { input: "", expectedOutput: "2 4 6 8 10 12 14 16 18 20 22 24 26 28 30 32 34 36 38 40 42 44 46 48 50 52 54 56 58 60 62 64 66 68 70 72 74 76 78 80 82 84 86 88 90 92 94 96 98 100" },
  ]),

createSeedQuestion(23, "Odd Numbers 1 to 100", 2, "Easy", "Print all odd numbers between 1 and 100 inclusive, separated by space.", "", "1 3 5 7 9 11 13 15 17 19 21 23 25 27 29 31 33 35 37 39 41 43 45 47 49 51 53 55 57 59 61 63 65 67 69 71 73 75 77 79 81 83 85 87 89 91 93 95 97 99", [
    { input: "", expectedOutput: "1 3 5 7 9 11 13 15 17 19 21 23 25 27 29 31 33 35 37 39 41 43 45 47 49 51 53 55 57 59 61 63 65 67 69 71 73 75 77 79 81 83 85 87 89 91 93 95 97 99" },
  ]),

createSeedQuestion(24, "Countdown 10 to 1", 2, "Easy", "Print numbers from 10 down to 1, each on a new line.", "", "10\n9\n8\n7\n6\n5\n4\n3\n2\n1", [
    { input: "", expectedOutput: "10\n9\n8\n7\n6\n5\n4\n3\n2\n1" },
  ]),

createSeedQuestion(25, "Multiplication Table", 2, "Easy", "Take integer N and print its multiplication table from N x 1 to N x 10 in format 'N x i = Result'.", "5", "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50", [
    { input: "5", expectedOutput: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50" },
    { input: "3", expectedOutput: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30" },
  ]),

createSeedQuestion(26, "Sum of First N Natural Numbers", 2, "Easy", "Given N, print the sum of 1 + 2 + ... + N.", "10", "55", [
    { input: "10", expectedOutput: "55" },
    { input: "5", expectedOutput: "15" },
    { input: "1", expectedOutput: "1" },
  ]),

createSeedQuestion(27, "Sum of Even Numbers up to N", 2, "Easy", "Given N, print the sum of all even numbers from 1 to N.", "10", "30", [
    { input: "10", expectedOutput: "30" },
    { input: "5", expectedOutput: "6" },
  ]),

createSeedQuestion(28, "Sum of Odd Numbers up to N", 2, "Easy", "Given N, print the sum of all odd numbers from 1 to N.", "10", "25", [
    { input: "10", expectedOutput: "25" },
    { input: "5", expectedOutput: "9" },
  ]),

createSeedQuestion(29, "Factorial of N", 2, "Easy", "Given non-negative integer N (0 <= N <= 12), print N!.", "5", "120", [
    { input: "5", expectedOutput: "120" },
    { input: "0", expectedOutput: "1" },
    { input: "6", expectedOutput: "720" },
  ]),

createSeedQuestion(30, "Product of Digits", 2, "Easy", "Given positive integer N, print the product of its digits.", "234", "24", [
    { input: "234", expectedOutput: "24" },
    { input: "105", expectedOutput: "0" },
    { input: "7", expectedOutput: "7" },
  ]),

createSeedQuestion(31, "Distinct Digits in 3-Digit Number", 1, "Medium", "Take a 3-digit number and check if all digits are distinct. Print 'Distinct' or 'Not Distinct'.", "123", "Distinct", [
    { input: "123", expectedOutput: "Distinct" },
    { input: "121", expectedOutput: "Not Distinct" },
    { input: "555", expectedOutput: "Not Distinct" },
  ]),

createSeedQuestion(32, "Middle Digit Comparison", 1, "Medium", "Take a 3-digit number. Print 'Largest', 'Smallest', or 'Neither' depending on whether the middle digit is strictly the largest, smallest, or neither among the three digits.", "193", "Largest", [
    { input: "193", expectedOutput: "Largest" },
    { input: "719", expectedOutput: "Smallest" },
    { input: "148", expectedOutput: "Neither" },
  ]),

createSeedQuestion(33, "First and Last Digit Equality", 1, "Medium", "Take a 4-digit number and check if first and last digits are equal. Print 'Equal' or 'Not Equal'.", "1231", "Equal", [
    { input: "1231", expectedOutput: "Equal" },
    { input: "5432", expectedOutput: "Not Equal" },
    { input: "9009", expectedOutput: "Equal" },
  ]),

createSeedQuestion(34, "Digit Count Classification", 1, "Easy", "Given a positive integer N, print 'Single Digit', 'Double Digit', or 'Multi Digit'.", "7", "Single Digit", [
    { input: "7", expectedOutput: "Single Digit" },
    { input: "42", expectedOutput: "Double Digit" },
    { input: "105", expectedOutput: "Multi Digit" },
  ]),

createSeedQuestion(35, "Multiple of 7 or Ends With 7", 1, "Easy", "Check if a number is a multiple of 7 or ends with digit 7. Print 'Yes' or 'No'.", "17", "Yes", [
    { input: "17", expectedOutput: "Yes" },
    { input: "14", expectedOutput: "Yes" },
    { input: "23", expectedOutput: "No" },
  ]),

createSeedQuestion(36, "Quadrant Identifier", 1, "Medium", "Given coordinates x and y (both non-zero) on separate lines, print 'Quadrant 1', 'Quadrant 2', 'Quadrant 3', or 'Quadrant 4'.", "2\n3", "Quadrant 1", [
    { input: "2\n3", expectedOutput: "Quadrant 1" },
    { input: "-2\n3", expectedOutput: "Quadrant 2" },
    { input: "-2\n-3", expectedOutput: "Quadrant 3" },
    { input: "2\n-3", expectedOutput: "Quadrant 4" },
  ]),

createSeedQuestion(37, "Currency Note Divisibility", 1, "Medium", "Check if an integer amount can be formed using 2000, 500, and 100 notes (i.e. divisible by 100). Print 'Yes' or 'No'.", "2300", "Yes", [
    { input: "2300", expectedOutput: "Yes" },
    { input: "2350", expectedOutput: "No" },
    { input: "100", expectedOutput: "Yes" },
  ]),

createSeedQuestion(38, "3-Digit Range Check", 1, "Easy", "Check if an integer N lies in range [100, 999]. Print 'In Range' or 'Out of Range'.", "450", "In Range", [
    { input: "450", expectedOutput: "In Range" },
    { input: "99", expectedOutput: "Out of Range" },
    { input: "1000", expectedOutput: "Out of Range" },
  ]),

createSeedQuestion(39, "Compute Third Angle of Triangle", 1, "Easy", "Given two angles a and b of a triangle on separate lines, print the third angle. If invalid, print 'Invalid'.", "60\n60", "60", [
    { input: "60\n60", expectedOutput: "60" },
    { input: "90\n45", expectedOutput: "45" },
    { input: "100\n90", expectedOutput: "Invalid" },
  ]),

createSeedQuestion(40, "Perfect Square Without Sqrt", 1, "Medium", "Check whether a given non-negative integer N (up to 10000) is a perfect square. Print 'Yes' or 'No'.", "25", "Yes", [
    { input: "25", expectedOutput: "Yes" },
    { input: "26", expectedOutput: "No" },
    { input: "0", expectedOutput: "Yes" },
    { input: "100", expectedOutput: "Yes" },
  ]),

  // Level 4: Logical Operators & Compound Statements (Medium),

createSeedQuestion(41, "Letter, Digit, or Neither", 1, "Easy", "Take a character and print 'Letter', 'Digit', or 'Neither'.", "a", "Letter", [
    { input: "a", expectedOutput: "Letter" },
    { input: "9", expectedOutput: "Digit" },
    { input: "$", expectedOutput: "Neither" },
  ]),

createSeedQuestion(42, "FizzBuzz Single Number", 1, "Easy", "Take a number N. If divisible by 3 and 5 print 'FizzBuzz', if by 3 print 'Fizz', if by 5 print 'Buzz', else print N.", "15", "FizzBuzz", [
    { input: "15", expectedOutput: "FizzBuzz" },
    { input: "9", expectedOutput: "Fizz" },
    { input: "10", expectedOutput: "Buzz" },
    { input: "7", expectedOutput: "7" },
  ]),

createSeedQuestion(43, "Median of Three Numbers", 1, "Medium", "Take three distinct numbers on separate lines and print the median value.", "10\n30\n20", "20", [
    { input: "10\n30\n20", expectedOutput: "20" },
    { input: "5\n2\n9", expectedOutput: "5" },
    { input: "-10\n0\n10", expectedOutput: "0" },
  ]),

createSeedQuestion(44, "24-Hour AM or PM", 1, "Easy", "Take hour H (0-23) and minute M (0-59) on separate lines. Print 'AM' or 'PM'.", "14\n30", "PM", [
    { input: "14\n30", expectedOutput: "PM" },
    { input: "9\n15", expectedOutput: "AM" },
    { input: "0\n0", expectedOutput: "AM" },
    { input: "12\n0", expectedOutput: "PM" },
  ]),

createSeedQuestion(45, "Tax Eligibility", 1, "Easy", "Take age and annual income in thousands (e.g., 600 for 6L). If age > 18 and income > 500, print 'Taxable', else 'Not Taxable'.", "25\n600", "Taxable", [
    { input: "25\n600", expectedOutput: "Taxable" },
    { input: "17\n700", expectedOutput: "Not Taxable" },
    { input: "30\n400", expectedOutput: "Not Taxable" },
  ]),

createSeedQuestion(46, "Positive and Sum Less Than 100", 1, "Easy", "Take two numbers. Check if both are positive and their sum is strictly less than 100. Print 'Yes' or 'No'.", "40\n50", "Yes", [
    { input: "40\n50", expectedOutput: "Yes" },
    { input: "50\n60", expectedOutput: "No" },
    { input: "-10\n20", expectedOutput: "No" },
  ]),

createSeedQuestion(47, "Single Digit to Word", 1, "Easy", "Take a digit 0-9 and print its word form ('Zero' to 'Nine').", "5", "Five", [
    { input: "0", expectedOutput: "Zero" },
    { input: "5", expectedOutput: "Five" },
    { input: "9", expectedOutput: "Nine" },
  ]),

createSeedQuestion(48, "Weekday or Weekend", 1, "Easy", "Take day number (1-7, where 1=Mon...6=Sat, 7=Sun). Print 'Weekday' or 'Weekend'.", "6", "Weekend", [
    { input: "3", expectedOutput: "Weekday" },
    { input: "6", expectedOutput: "Weekend" },
    { input: "7", expectedOutput: "Weekend" },
  ]),

createSeedQuestion(49, "Electricity Bill Slabs", 1, "Medium", "Take electricity units consumed U. First 100 units at 5/unit, next 100 units (101-200) at 7/unit, above 200 at 10/unit. Print total bill.", "150", "850", [
    { input: "50", expectedOutput: "250" },
    { input: "150", expectedOutput: "850" },
    { input: "250", expectedOutput: "1700" },
  ]),

createSeedQuestion(50, "Password Rule Validation", 1, "Medium", "Take a password string. Check if length >= 8 and it contains at least one numeric digit. Print 'Valid' or 'Invalid'.", "secure123", "Valid", [
    { input: "secure123", expectedOutput: "Valid" },
    { input: "short1", expectedOutput: "Invalid" },
    { input: "nodigitsinside", expectedOutput: "Invalid" },
  ]),

  // Level 5: Creative / Tricky Scenarios (Medium - Hard),

createSeedQuestion(51, "Axis or Origin Point", 1, "Medium", "Given coordinates x and y on separate lines. Print 'Origin', 'X-axis', 'Y-axis', or 'None'.", "0\n0", "Origin", [
    { input: "0\n0", expectedOutput: "Origin" },
    { input: "5\n0", expectedOutput: "X-axis" },
    { input: "0\n-3", expectedOutput: "Y-axis" },
    { input: "2\n3", expectedOutput: "None" },
  ]),

createSeedQuestion(52, "Pythagorean Triplet", 1, "Medium", "Take three positive integers a, b, c in any order on separate lines. Check if they form a Pythagorean triplet. Print 'Yes' or 'No'.", "3\n4\n5", "Yes", [
    { input: "3\n4\n5", expectedOutput: "Yes" },
    { input: "5\n12\n13", expectedOutput: "Yes" },
    { input: "4\n5\n6", expectedOutput: "No" },
  ]),

createSeedQuestion(53, "Valid Calendar Date", 1, "Medium", "Given day D and month M on separate lines. Check if it is a valid date (non-leap year, Feb has 28 days). Print 'Valid' or 'Invalid'.", "31\n4", "Invalid", [
    { input: "31\n4", expectedOutput: "Invalid" },
    { input: "28\n2", expectedOutput: "Valid" },
    { input: "31\n12", expectedOutput: "Valid" },
    { input: "29\n2", expectedOutput: "Invalid" },
  ]),

createSeedQuestion(54, "Clock Hands Angle", 1, "Hard", "Given hour H (1-12) and minute M (0-59) on separate lines. Print the smaller angle in degrees (rounded to 1 decimal place or integer if whole).", "3\n0", "90", [
    { input: "3\n0", expectedOutput: "90" },
    { input: "6\n0", expectedOutput: "180" },
    { input: "12\n30", expectedOutput: "165" },
  ]),

createSeedQuestion(55, "Arithmetic Progression Check", 1, "Medium", "Take three numbers a, b, c on separate lines. Check if they are in AP (in given order). Print 'Yes' or 'No'.", "2\n4\n6", "Yes", [
    { input: "2\n4\n6", expectedOutput: "Yes" },
    { input: "1\n5\n9", expectedOutput: "Yes" },
    { input: "2\n5\n7", expectedOutput: "No" },
  ]),

createSeedQuestion(56, "Geometric Progression Check", 1, "Medium", "Take three non-zero numbers a, b, c on separate lines. Check if they are in GP (in given order). Print 'Yes' or 'No'.", "2\n4\n8", "Yes", [
    { input: "2\n4\n8", expectedOutput: "Yes" },
    { input: "3\n9\n27", expectedOutput: "Yes" },
    { input: "2\n4\n6", expectedOutput: "No" },
  ]),

createSeedQuestion(57, "Sum of Ends Equals Middle", 1, "Medium", "Take a 3-digit number. Check if the sum of the first and last digit equals the middle digit. Print 'Yes' or 'No'.", "132", "Yes", [
    { input: "132", expectedOutput: "Yes" },
    { input: "253", expectedOutput: "Yes" },
    { input: "142", expectedOutput: "No" },
  ]),

createSeedQuestion(58, "Digit Sum Greater Than Product", 1, "Medium", "Take an integer (1-9999). Check if sum of its digits is strictly greater than the product of its digits. Print 'Yes' or 'No'.", "1111", "Yes", [
    { input: "1111", expectedOutput: "Yes" },
    { input: "234", expectedOutput: "No" },
    { input: "100", expectedOutput: "Yes" },
  ]),

createSeedQuestion(59, "Earlier Date in Calendar", 1, "Medium", "Given day1, month1 and day2, month2 (4 integers on separate lines). Print 'Date 1', 'Date 2', or 'Same'.", "15\n3\n20\n3", "Date 1", [
    { input: "15\n3\n20\n3", expectedOutput: "Date 1" },
    { input: "10\n8\n5\n7", expectedOutput: "Date 2" },
    { input: "1\n1\n1\n1", expectedOutput: "Same" },
  ]),

createSeedQuestion(60, "Century from Year", 1, "Medium", "Take a year (e.g. 1905). Print its century format (e.g. '20th Century' or '19th Century' for 1900).", "1905", "20th Century", [
    { input: "1905", expectedOutput: "20th Century" },
    { input: "1900", expectedOutput: "19th Century" },
    { input: "2000", expectedOutput: "20th Century" },
    { input: "2024", expectedOutput: "21st Century" },
  ]),

  // PHASE 2: LOOPING & PATTERNS (Questions 051 - 090),

createSeedQuestion(61, "Count Digits", 2, "Easy", "Given non-negative integer N, print the total number of digits.", "12345", "5", [
    { input: "12345", expectedOutput: "5" },
    { input: "0", expectedOutput: "1" },
    { input: "99", expectedOutput: "2" },
  ]),

createSeedQuestion(62, "Reverse a Number", 2, "Easy", "Given positive integer N, print its digits reversed without leading zeros.", "1234", "4321", [
    { input: "1234", expectedOutput: "4321" },
    { input: "100", expectedOutput: "1" },
    { input: "5", expectedOutput: "5" },
  ]),

createSeedQuestion(63, "Palindrome Number Check", 2, "Easy", "Given integer N, check if it reads the same backwards. Print 'Yes' or 'No'.", "121", "Yes", [
    { input: "121", expectedOutput: "Yes" },
    { input: "123", expectedOutput: "No" },
    { input: "7", expectedOutput: "Yes" },
  ]),

createSeedQuestion(64, "Sum of Digits", 2, "Easy", "Given non-negative integer N, print the sum of its digits.", "123", "6", [
    { input: "123", expectedOutput: "6" },
    { input: "999", expectedOutput: "27" },
    { input: "0", expectedOutput: "0" },
  ]),

createSeedQuestion(65, "Armstrong Number", 2, "Medium", "Check if an integer N is an Armstrong number (sum of d^k = N where k is digit count). Print 'Yes' or 'No'.", "153", "Yes", [
    { input: "153", expectedOutput: "Yes" },
    { input: "370", expectedOutput: "Yes" },
    { input: "120", expectedOutput: "No" },
  ]),

createSeedQuestion(66, "Perfect Number Check", 2, "Medium", "Check if positive integer N equals the sum of its proper divisors. Print 'Yes' or 'No'.", "6", "Yes", [
    { input: "6", expectedOutput: "Yes" },
    { input: "28", expectedOutput: "Yes" },
    { input: "12", expectedOutput: "No" },
  ]),

createSeedQuestion(67, "Prime Numbers Between 1 and 100", 2, "Medium", "Print all prime numbers between 1 and 100 inclusive, separated by space.", "", "2 3 5 7 11 13 17 19 23 29 31 37 41 43 47 53 59 61 67 71 73 79 83 89 97", [
    { input: "", expectedOutput: "2 3 5 7 11 13 17 19 23 29 31 37 41 43 47 53 59 61 67 71 73 79 83 89 97" },
  ]),

createSeedQuestion(68, "Prime Checker", 2, "Easy", "Given integer N (> 1), print 'Prime' or 'Not Prime'.", "17", "Prime", [
    { input: "17", expectedOutput: "Prime" },
    { input: "4", expectedOutput: "Not Prime" },
    { input: "2", expectedOutput: "Prime" },
  ]),

createSeedQuestion(69, "Fibonacci Series Up to N Terms", 2, "Medium", "Given N (>= 1), print the first N Fibonacci numbers (starting 0, 1, 1, 2...) separated by space.", "6", "0 1 1 2 3 5", [
    { input: "6", expectedOutput: "0 1 1 2 3 5" },
    { input: "1", expectedOutput: "0" },
    { input: "2", expectedOutput: "0 1" },
  ]),

createSeedQuestion(70, "Sum of Fibonacci Series", 2, "Medium", "Given N (>= 1), print the sum of the first N Fibonacci numbers.", "5", "7", [
    { input: "5", expectedOutput: "7" },
    { input: "3", expectedOutput: "2" },
  ]),

  // PHASE 4: BASIC ARRAYS (Samples for 131 - 180),

createSeedQuestion(71, "Squares from 1 to N", 2, "Easy", "Given positive integer N, print squares of numbers from 1 to N separated by space.", "5", "1 4 9 16 25", [
    { input: "5", expectedOutput: "1 4 9 16 25" },
    { input: "3", expectedOutput: "1 4 9" },
    { input: "1", expectedOutput: "1" }
  ]),

createSeedQuestion(72, "Cubes from 1 to N", 2, "Easy", "Given positive integer N, print cubes of numbers from 1 to N separated by space.", "4", "1 8 27 64", [
    { input: "4", expectedOutput: "1 8 27 64" },
    { input: "1", expectedOutput: "1" },
    { input: "5", expectedOutput: "1 8 27 64 125" }
  ]),

createSeedQuestion(73, "Numbers Between A and B Divisible by 7", 2, "Easy", "Given two integers A and B (A <= B) on separate lines, print all numbers between A and B inclusive that are divisible by 7, separated by space.", "10\n30", "14 21 28", [
    { input: "10\n30", expectedOutput: "14 21 28" },
    { input: "1\n14", expectedOutput: "7 14" },
    { input: "20\n25", expectedOutput: "21" }
  ]),

createSeedQuestion(74, "GCD / HCF of Two Numbers", 2, "Medium", "Given two positive integers A and B on separate lines, find their Greatest Common Divisor (GCD) using loops.", "12\n18", "6", [
    { input: "12\n18", expectedOutput: "6" },
    { input: "7\n13", expectedOutput: "1" },
    { input: "24\n36", expectedOutput: "12" }
  ]),

createSeedQuestion(75, "LCM of Two Numbers", 2, "Medium", "Given two positive integers A and B on separate lines, find their Least Common Multiple (LCM) using loops.", "4\n6", "12", [
    { input: "4\n6", expectedOutput: "12" },
    { input: "3\n5", expectedOutput: "15" },
    { input: "12\n18", expectedOutput: "36" }
  ]),

createSeedQuestion(76, "Print All Factors of a Number", 2, "Easy", "Given positive integer N, print all factors of N in ascending order separated by space.", "12", "1 2 3 4 6 12", [
    { input: "12", expectedOutput: "1 2 3 4 6 12" },
    { input: "7", expectedOutput: "1 7" },
    { input: "16", expectedOutput: "1 2 4 8 16" }
  ]),

createSeedQuestion(77, "Sum of All Factors", 2, "Medium", "Given positive integer N, find the sum of all factors of N.", "6", "12", [
    { input: "6", expectedOutput: "12" },
    { input: "12", expectedOutput: "28" },
    { input: "1", expectedOutput: "1" }
  ]),

createSeedQuestion(78, "Strong Number Check", 2, "Hard", "Check whether a given positive integer N is a Strong number (sum of factorials of its digits equals N). Print 'Yes' or 'No'.", "145", "Yes", [
    { input: "145", expectedOutput: "Yes" },
    { input: "120", expectedOutput: "No" },
    { input: "2", expectedOutput: "Yes" }
  ]),

createSeedQuestion(79, "First N Terms of AP", 2, "Easy", "Given N, first term A, and common difference D on separate lines, print first N terms of Arithmetic Progression separated by space.", "5\n2\n3", "2 5 8 11 14", [
    { input: "5\n2\n3", expectedOutput: "2 5 8 11 14" },
    { input: "4\n1\n2", expectedOutput: "1 3 5 7" },
    { input: "3\n10\n-2", expectedOutput: "10 8 6" }
  ]),

createSeedQuestion(80, "First N Terms of GP", 2, "Easy", "Given N, first term A, and common ratio R on separate lines, print first N terms of Geometric Progression separated by space.", "4\n2\n3", "2 6 18 54", [
    { input: "4\n2\n3", expectedOutput: "2 6 18 54" },
    { input: "3\n1\n2", expectedOutput: "1 2 4" },
    { input: "4\n5\n2", expectedOutput: "5 10 20 40" }
  ])
];
