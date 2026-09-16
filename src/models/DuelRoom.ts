import mongoose, { Schema, Model } from "mongoose";
import { IDuelRoom, IDuelPlayer, IDuelRound } from "@/types";

const DuelPlayerSchema = new Schema<IDuelPlayer>(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    image: { type: String },
    status: {
      type: String,
      enum: ["CODING", "SUBMITTED", "SOLVED"],
      default: "CODING",
    },
    submittedAt: { type: Date },
    testsPassed: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    runtime: { type: Number },
  },
  { _id: false }
);

const DuelRoundSchema = new Schema<IDuelRound>(
  {
    roundNumber: { type: Number, required: true },
    problemId: { type: String, required: true },
    problemTitle: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    startedAt: { type: Date },
    endsAt: { type: Date },
    winner: { type: String, default: null },
    finishedAt: { type: Date },
    player1Status: {
      type: String,
      enum: ["CODING", "SUBMITTED", "SOLVED"],
      default: "CODING",
    },
    player2Status: {
      type: String,
      enum: ["CODING", "SUBMITTED", "SOLVED"],
      default: "CODING",
    },
    player1SubmittedAt: { type: Date },
    player2SubmittedAt: { type: Date },
    player1TestsPassed: { type: Number, default: 0 },
    player2TestsPassed: { type: Number, default: 0 },
    player1TotalTests: { type: Number, default: 0 },
    player2TotalTests: { type: Number, default: 0 },
    player1Runtime: { type: Number },
    player2Runtime: { type: Number },
  },
  { _id: false }
);

const DuelRoomSchema = new Schema<IDuelRoom>(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    rounds: {
      type: Number,
      default: 3,
      required: true,
    },
    currentRound: {
      type: Number,
      default: 1,
      required: true,
    },
    roundsData: {
      type: [DuelRoundSchema],
      default: [],
    },
    player1: {
      type: DuelPlayerSchema,
      required: true,
    },
    player2: {
      type: DuelPlayerSchema,
      default: undefined,
    },
    player1Score: {
      type: Number,
      default: 0,
    },
    player2Score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["WAITING", "COUNTDOWN", "ACTIVE", "FINISHED", "CANCELLED", "EXPIRED"],
      default: "WAITING",
      index: true,
    },
    countdownEndsAt: {
      type: Date,
    },
    winner: {
      type: String,
      default: null,
    },
    finishedAt: {
      type: Date,
    },
    finalizedAt: {
      type: Date,
      default: null,
      index: true,
    },
    cancelReason: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

DuelRoomSchema.index({ roomCode: 1, status: 1 });
DuelRoomSchema.index({ "player1.userId": 1 });
DuelRoomSchema.index({ "player2.userId": 1 });
DuelRoomSchema.index({ createdAt: -1 });

export const DuelRoom: Model<IDuelRoom> =
  mongoose.models.DuelRoom || mongoose.model<IDuelRoom>("DuelRoom", DuelRoomSchema);
