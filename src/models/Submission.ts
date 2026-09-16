import mongoose, { Schema, Model } from "mongoose";
import { ISubmission } from "@/types";

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    problemId: {
      type: String,
      required: true,
      index: true,
    },
    problemTitle: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      maxlength: 100 * 1024,
    },
    status: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Compilation Error",
        "Runtime Error",
        "Time Limit Exceeded",
        "System Error",
      ],
      required: true,
      index: true,
    },
    runtime: {
      type: Number,
    },
    memory: {
      type: Number,
    },
    errorDetails: {
      type: String,
    },
    testsPassed: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    awardedXp: {
      type: Number,
      default: 0,
    },
    awardedLanguagePoints: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

SubmissionSchema.index({ userId: 1, problemId: 1, status: 1 });
SubmissionSchema.index({ createdAt: -1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);
