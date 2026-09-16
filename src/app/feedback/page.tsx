"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bug,
  Sparkles,
  Palette,
  Terminal,
  HelpCircle,
} from "lucide-react";

type FeedbackType =
  | "Bug Report"
  | "Feature Request"
  | "UI / Design"
  | "Compiler / Execution"
  | "Other";

const FEEDBACK_TYPES: { type: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "Bug Report", label: "Bug Report", icon: Bug },
  { type: "Feature Request", label: "Feature Request", icon: Sparkles },
  { type: "UI / Design", label: "UI / Design", icon: Palette },
  { type: "Compiler / Execution", label: "Compiler / Execution", icon: Terminal },
  { type: "Other", label: "Other", icon: HelpCircle },
];

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("Bug Report");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!subject.trim()) {
      setErrorMessage("Please enter a subject.");
      return;
    }

    if (subject.trim().length < 3) {
      setErrorMessage("Subject must be at least 3 characters.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Please write your message.");
      return;
    }

    if (message.trim().length < 10) {
      setErrorMessage("Message must be at least 10 characters.");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          subject: subject.trim(),
          message: message.trim(),
          contactEmail: contactEmail.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Feedback sent successfully.");
        setSubject("");
        setMessage("");
        setContactEmail("");
      } else {
        setErrorMessage(data.error || "Unable to send feedback. Please try again.");
      }
    } catch {
      setErrorMessage("Unable to send feedback. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-8">
      {/* -- Page Header ---------------------------------------------- */}
      <div
        className="pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p className="section-label mb-1">Direct Communication</p>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          Feedback & Support
        </h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--fg-muted)" }}>
          Help us sharpen InsidCode. Report bugs, propose features, or share observations directly with engineering.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          className="flex items-center gap-3 p-4 text-[12px]"
          style={{
            border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--success) 8%, transparent)",
            borderRadius: "3px",
            color: "var(--success)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{successMessage}</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Thank you for helping improve the platform.
            </p>
          </div>
        </div>
      )}

      {/* Error Notification (preserves user message) */}
      {errorMessage && (
        <div
          className="flex items-center gap-3 p-4 text-[12px]"
          style={{
            border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--danger) 8%, transparent)",
            borderRadius: "3px",
            color: "var(--danger)",
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback Type Selector */}
        <div>
          <label className="section-label block mb-2">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {FEEDBACK_TYPES.map(({ type, label, icon: Icon }) => {
              const isSelected = feedbackType === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFeedbackType(type)}
                  className="flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer"
                  style={{
                    border: isSelected
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                    backgroundColor: isSelected
                      ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                      : "var(--bg)",
                    borderRadius: "3px",
                    color: isSelected ? "var(--fg)" : "var(--fg-muted)",
                  }}
                >
                  <Icon className="h-4 w-4 mb-1.5" />
                  <span className="text-[11px] font-medium leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sender Identity Info */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "3px",
          }}
        >
          <div>
            <p className="section-label">Sender Handle</p>
            <p className="mono text-[12px] font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
              {session?.user?.username ? `@${session.user.username}` : "Anonymous Developer"}
            </p>
          </div>
          <div>
            <label className="section-label block">Contact Email (Optional)</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={session?.user?.email || "developer@example.com"}
              className="w-full mt-1 px-2.5 py-1.5 text-[12px] mono focus:outline-none"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
                borderRadius: "2px",
              }}
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="section-label block mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={100}
            placeholder="Brief summary of the issue or feature"
            required
            className="w-full px-3 py-2 text-[13px] focus:outline-none"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--fg)",
              borderRadius: "3px",
            }}
          />
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="section-label">Details</label>
            <span className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
              {message.length} / 2000
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={7}
            placeholder="Detailed description, reproduction steps, or suggested design..."
            required
            className="w-full p-3 text-[12px] font-mono leading-relaxed focus:outline-none resize-y"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--fg)",
              borderRadius: "3px",
            }}
          />
        </div>

        {/* Destination Note & Submit */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>
            Destination: nam4sh@gmail.com
          </p>

          <button
            type="submit"
            disabled={isSending || !subject.trim() || !message.trim()}
            className="btn btn-primary inline-flex items-center justify-center gap-2 text-[12px] px-5 py-2.5 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Send Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
