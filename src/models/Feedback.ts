import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  userId?: string;
  username: string;
  email: string;
  feedbackType: "Bug Report" | "Feature Request" | "UI / Design" | "Compiler / Execution" | "Other";
  subject: string;
  message: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED";
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: String, index: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    feedbackType: {
      type: String,
      enum: ["Bug Report", "Feature Request", "UI / Design", "Compiler / Execution", "Other"],
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["NEW", "IN_REVIEW", "RESOLVED"],
      default: "NEW",
      index: true,
    },
    adminNotes: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

FeedbackSchema.index({ status: 1, createdAt: -1 });
FeedbackSchema.index({ createdAt: -1 });

export const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);
