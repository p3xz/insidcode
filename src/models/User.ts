import mongoose, { Schema, Model } from "mongoose";
import { IUser } from "@/types";

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[A-Za-z0-9_]{3,20}$/,
    },
    usernameNormalized: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
    },
    providerAccountId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: String,
    },
    solvedProblems: {
      type: [String],
      default: [],
    },
    attemptedProblems: {
      type: [String],
      default: [],
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
    },
    leaderboardVisible: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
    },
    bannedAt: {
      type: Date,
    },
    bannedUntil: {
      type: Date,
    },
    preferences: {
      editorFontSize: { type: Number, default: 14 },
      minimap: { type: Boolean, default: false },
      defaultLanguage: { type: String, default: "python" },
      reducedMotion: { type: Boolean, default: false },
      soundEnabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
UserSchema.index({ xp: -1, solvedProblems: -1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
