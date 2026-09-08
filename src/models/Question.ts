import mongoose, { Schema, Model } from "mongoose";
import { IQuestion } from "@/types";

const ExampleSchema = new Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const StarterTemplatesSchema = new Schema(
  {
    python: { type: String },
    javascript: { type: String },
    c: { type: String },
    cpp: { type: String },
    java: { type: String },
  },
  { _id: false }
);

const HiddenTestCaseSchema = new Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    problemId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phase: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    constraints: {
      type: [String],
      default: [],
    },
    examples: {
      type: [ExampleSchema],
      default: [],
    },
    starterTemplates: {
      type: StarterTemplatesSchema,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
    },
    xp: {
      type: Number,
      required: true,
      min: 10,
    },
    hiddenTestCases: {
      type: [HiddenTestCaseSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ phase: 1, difficulty: 1, isPublished: 1 });

export const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
