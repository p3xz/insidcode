import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppeal extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  email: string;
  banReason?: string;
  reason: string;
  statement: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt?: Date;
  reviewedBy?: string;
  decision?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppealSchema = new Schema<IAppeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true, index: true },
    email: { type: String, required: true },
    banReason: { type: String },
    reason: { type: String, required: true },
    statement: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: String },
    decision: { type: String },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

AppealSchema.index({ userId: 1, createdAt: -1 });
AppealSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } }
);

export const Appeal: Model<IAppeal> =
  mongoose.models.Appeal || mongoose.model<IAppeal>("Appeal", AppealSchema);
