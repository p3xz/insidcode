import mongoose, { Schema, Model } from "mongoose";
import { ILanguageSolve } from "@/types";

const LanguageSolveSchema = new Schema<ILanguageSolve>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    problemId: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["python", "javascript", "c", "cpp", "java"],
      index: true,
    },
    points: {
      type: Number,
      default: 10,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Server-side compound unique index enforcing atomic duplicate protection against race conditions
LanguageSolveSchema.index({ userId: 1, problemId: 1, language: 1 }, { unique: true });

export const LanguageSolve: Model<ILanguageSolve> =
  mongoose.models.LanguageSolve ||
  mongoose.model<ILanguageSolve>("LanguageSolve", LanguageSolveSchema);
