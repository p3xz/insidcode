import mongoose, { Schema, Model } from "mongoose";
import { IAdminAction } from "@/types";

const AdminActionSchema = new Schema<IAdminAction>(
  {
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    adminUsername: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetUserId: {
      type: String,
      index: true,
    },
    targetProblemId: {
      type: String,
      index: true,
    },
    previousValue: {
      type: String,
    },
    newValue: {
      type: String,
    },
    reason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AdminActionSchema.index({ createdAt: -1 });

export const AdminAction: Model<IAdminAction> =
  mongoose.models.AdminAction ||
  mongoose.model<IAdminAction>("AdminAction", AdminActionSchema);
