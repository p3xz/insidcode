import mongoose, { Schema, Model } from "mongoose";
import { ISystemConfig } from "@/types";

const AnnouncementSchema = new Schema(
  {
    active: { type: Boolean, default: false },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
    },
    leaderboardFrozen: {
      type: Boolean,
      default: false,
    },
    frozenAt: {
      type: Date,
    },
    announcement: {
      type: AnnouncementSchema,
      default: () => ({ active: false, title: "", message: "", updatedAt: new Date() }),
    },
  },
  {
    timestamps: true,
  }
);

export const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig ||
  mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);
