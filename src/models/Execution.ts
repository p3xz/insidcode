import mongoose, { Schema, Model } from "mongoose";
import { IExecution } from "@/types";

const ExecutionSchema = new Schema<IExecution>(
  {
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    queueId: {
      type: Schema.Types.Mixed,
      index: true,
    },
    compiler: {
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
    input: {
      type: String,
      maxlength: 100 * 1024,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "queued",
        "running",
        "success",
        "error",
        "timeout",
        "failed",
        "cancelled",
        "expired",
      ],
      default: "queued",
      index: true,
    },
    stdout: {
      type: String,
      default: "",
    },
    stderr: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    exitCode: {
      type: Number,
      default: null,
    },
    signal: {
      type: String,
      default: null,
    },
    time: {
      type: String,
      default: null,
    },
    memory: {
      type: String,
      default: null,
    },
    compilationError: {
      type: String,
    },
    runtimeError: {
      type: String,
    },
    isTimeout: {
      type: Boolean,
      default: false,
    },
    systemError: {
      type: String,
    },
    claimedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically expire execution logs after 24 hours
ExecutionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
ExecutionSchema.index({ userId: 1, createdAt: -1 });
ExecutionSchema.index({ status: 1, createdAt: 1 });

export const Execution: Model<IExecution> =
  mongoose.models.Execution ||
  mongoose.model<IExecution>("Execution", ExecutionSchema);

