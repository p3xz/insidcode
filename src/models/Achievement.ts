import mongoose, { Schema, Model } from "mongoose";
import { IAchievement } from "@/types";

const AchievementSchema = new Schema<IAchievement>(
  {
    key: {
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
    },
    description: {
      type: String,
      required: true,
    },
    iconName: {
      type: String,
      required: true,
    },
    requirementType: {
      type: String,
      enum: ["solve_count", "streak", "phase_complete", "difficulty_solve"],
      required: true,
    },
    requirementValue: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Achievement: Model<IAchievement> =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);
