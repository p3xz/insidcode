"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Sliders,
  Shield,
  AlertTriangle,
  Loader2,
  Save,
  Trash2,
  Edit3,
  Check,
  X,
  AtSign,
  Award,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface TitleOption {
  id: string;
  title: string;
  description: string;
  category: string;
  unlocked: boolean;
}

interface UserSettingsState {
  username: string;
  displayName: string;
  email?: string;
  image?: string;
  provider: string;
  role: string;
  leaderboardVisible: boolean;
  preferences: {
    editorFontSize?: number;
    minimap?: boolean;
    defaultLanguage?: string;
    reducedMotion?: boolean;
    soundEnabled?: boolean;
  };
  createdAt: string;
}

export default function SettingsPage() {
  const { update: updateSession } = useSession();

  const [settings, setSettings] = useState<UserSettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Titles state
  const [titles, setTitles] = useState<TitleOption[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleSuccess, setTitleSuccess] = useState("");
  const [titleError, setTitleError] = useState("");

  // Username edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsernameInput, setEditUsernameInput] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, titlesRes] = await Promise.all([
          fetch("/api/user/settings"),
          fetch("/api/user/titles"),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data.user);
          setEditUsernameInput(data.user.username);
        }

        if (titlesRes.ok) {
          const titlesData = await titlesRes.json();
          setTitles(titlesData.titles || []);
          setSelectedTitle(titlesData.selectedTitle || null);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSelectTitle = async (newTitle: string | null) => {
    setTitleLoading(true);
    setTitleError("");
    setTitleSuccess("");

    try {
      const res = await fetch("/api/user/titles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTitleError(data.error || "Failed to update title.");
      } else {
        setSelectedTitle(data.selectedTitle || null);
        setTitleSuccess(data.message || "Title updated successfully.");
        setTimeout(() => setTitleSuccess(""), 4000);
      }
    } catch {
      setTitleError("Network error while updating title.");
    } finally {
      setTitleLoading(false);
    }
  };

  const validateUsernameInput = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Username cannot be empty.";
    }
    if (trimmed.length < 3) {
      return "Username must be at least 3 characters.";
    }
    if (trimmed.length > 20) {
      return "Username cannot exceed 20 characters.";
    }
    if (/\s/.test(value)) {
      return "Username cannot contain spaces.";
    }
    if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
      return "Username can only contain letters, numbers, and underscores.";
    }
    return null;
  };

  const handleStartEditUsername = () => {
    if (!settings) return;
    setEditUsernameInput(settings.username);
    setUsernameError("");
    setUsernameSuccess("");
    setIsEditingUsername(true);
  };

  const handleCancelEditUsername = () => {
    if (!settings) return;
    setEditUsernameInput(settings.username);
    setUsernameError("");
    setIsEditingUsername(false);
  };

  const handleSaveUsername = async () => {
    if (!settings) return;

    const validationErr = validateUsernameInput(editUsernameInput);
    if (validationErr) {
      setUsernameError(validationErr);
      return;
    }

    const trimmed = editUsernameInput.trim();

    // If unchanged, simply exit edit mode
    if (trimmed === settings.username) {
      setIsEditingUsername(false);
      return;
    }

    setUsernameLoading(true);
    setUsernameError("");
    setUsernameSuccess("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUsernameError(data.error || "Failed to update username.");
        return;
      }

      // Success
      setSettings((prev) => (prev ? { ...prev, username: data.username } : null));
      setEditUsernameInput(data.username);
      setIsEditingUsername(false);
      setUsernameSuccess("Username updated successfully.");

      // Synchronize NextAuth session in real time
      if (updateSession) {
        await updateSession({ username: data.username });
      }

      setTimeout(() => setUsernameSuccess(""), 4000);
    } catch {
      setUsernameError("Network error while updating username.");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaveLoading(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: settings.displayName,
          leaderboardVisible: settings.leaderboardVisible,
          preferences: settings.preferences,
        }),
      });

      if (res.ok) {
        if (updateSession) {
          await updateSession({ preferences: settings.preferences });
        }
        setStatusMessage("Settings updated successfully.");
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        const data = await res.json();
        setStatusMessage(data.error || "Failed to update settings.");
      }
    } catch {
      setStatusMessage("Error updating settings.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== "DELETE") {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account.");
      }
    } catch {
      setDeleteError("Network error during account deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center text-xs text-[var(--fg-muted)]">
        Please sign in to manage your account settings.
      </div>
    );
  }

  const usernameValidationError = isEditingUsername ? validateUsernameInput(editUsernameInput) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Account & Preferences</h1>
        <p className="text-xs text-[var(--fg-muted)]">
          Customize your coding environment, profile display, and account preferences.
        </p>
      </div>

      {/* Username Feedback Banners */}
      {usernameSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-[#39FF14]/30 bg-[#39FF14]/10 p-3 text-xs text-[#39FF14]">
          <Check className="h-4 w-4 shrink-0" />
          <span>{usernameSuccess}</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#00F0FF]" />
          <h3 className="text-sm font-bold text-[var(--fg)]">Profile Identity</h3>
        </div>

        {/* Username Editing Section */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-[var(--fg)]">Username</label>
              <p className="text-[11px] text-[var(--fg-muted)]">
                Your unique developer handle displayed across leaderboards and submissions.
              </p>
            </div>

            {!isEditingUsername && (
              <button
                type="button"
                onClick={handleStartEditUsername}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--fg)] hover:border-[#00F0FF] hover:text-[#00F0FF] transition"
              >
                <Edit3 className="h-3 w-3" />
                Edit Username
              </button>
            )}
          </div>

          {!isEditingUsername ? (
            <div className="flex items-center gap-2 pt-1">
              <span className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-xs font-bold text-[#00F0FF]">
                <AtSign className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                {settings.username}
              </span>
              <span className="text-[11px] text-[var(--fg-dimmed)]">Case-insensitive uniqueness</span>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--fg-muted)]">
                    <AtSign className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    value={editUsernameInput}
                    onChange={(e) => {
                      setEditUsernameInput(e.target.value);
                      setUsernameError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveUsername();
                      } else if (e.key === "Escape") {
                        handleCancelEditUsername();
                      }
                    }}
                    maxLength={20}
                    placeholder="Enter new username"
                    autoFocus
                    disabled={usernameLoading}
                    className="w-full rounded-md border border-[#00F0FF]/50 bg-[var(--bg-elevated)] py-2 pl-9 pr-14 font-mono text-xs text-[var(--fg)] placeholder-[#5E667B] focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF]"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-[10px] text-[var(--fg-muted)]">
                    {editUsernameInput.length}/20
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveUsername}
                    disabled={
                      usernameLoading ||
                      Boolean(usernameValidationError) ||
                      editUsernameInput.trim() === settings.username
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-[#00F0FF] px-4 py-2 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 disabled:opacity-50 transition"
                  >
                    {usernameLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEditUsername}
                    disabled={usernameLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] disabled:opacity-50 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>

              {/* Inline Validation / Server Error */}
              {usernameError ? (
                <p className="text-xs text-[#FF4D6D] font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {usernameError}
                </p>
              ) : usernameValidationError && editUsernameInput.length > 0 ? (
                <p className="text-xs text-[#F59E0B] flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {usernameValidationError}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--fg-muted)]">
                  3 to 20 characters. Only letters, numbers, and underscores allowed.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Display Name Input */}
        <div className="pt-2">
          <label className="block mb-1 text-xs text-[var(--fg-muted)]">Display Name (max 40 chars)</label>
          <input
            type="text"
            value={settings.displayName}
            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
            maxLength={40}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-xs text-[var(--fg)] focus:border-[#00F0FF] focus:outline-none"
          />
        </div>

        {/* Developer Title Selection */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[var(--accent)]" />
                <label className="text-xs font-semibold text-[var(--fg)]">Developer Title</label>
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">
                Server-verified title displayed on your public profile and leaderboard entries.
              </p>
            </div>
            {selectedTitle && (
              <span
                className="mono text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--fg)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "2px",
                }}
              >
                {selectedTitle}
              </span>
            )}
          </div>

          {titleSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-[#39FF14]">
              <Check className="h-3.5 w-3.5" />
              <span>{titleSuccess}</span>
            </div>
          )}

          {titleError && (
            <div className="flex items-center gap-1.5 text-xs text-[#FF4D6D]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{titleError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <select
              value={selectedTitle || ""}
              onChange={(e) => handleSelectTitle(e.target.value || null)}
              disabled={titleLoading}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-xs text-[var(--fg)] focus:border-[#00F0FF] focus:outline-none disabled:opacity-50"
            >
              <option value="">None (No Title)</option>
              {titles.map((t) => (
                <option
                  key={t.id}
                  value={t.title}
                  disabled={!t.unlocked}
                >
                  {t.title} {t.unlocked ? "✓" : `(Locked: ${t.description})`}
                </option>
              ))}
            </select>
            {titleLoading && <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)] self-center" />}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Editor Preferences */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#39FF14]" />
            <h3 className="text-sm font-bold text-[var(--fg)]">Code Editor Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-xs text-[var(--fg-muted)]">Font Size (px)</label>
              <input
                type="number"
                min={11}
                max={24}
                value={settings.preferences.editorFontSize || 14}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      editorFontSize: parseInt(e.target.value, 10) || 14,
                    },
                  })
                }
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-xs font-mono text-[var(--fg)] focus:border-[#00F0FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs text-[var(--fg-muted)]">Default Language</label>
              <select
                value={settings.preferences.defaultLanguage || "java"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      defaultLanguage: e.target.value,
                    },
                  })
                }
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-xs text-[var(--fg)] focus:border-[#00F0FF] focus:outline-none"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={settings.preferences.minimap || false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      preferences: {
                        ...settings.preferences,
                        minimap: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-[var(--border)] bg-[var(--bg-elevated)] text-[#00F0FF] focus:ring-0"
                />
                <span className="text-xs text-[var(--fg)]">Show Code Minimap</span>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy & Social */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#00F0FF]" />
            <h3 className="text-sm font-bold text-[var(--fg)]">Privacy & Leaderboard Visibility</h3>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.leaderboardVisible}
              onChange={(e) => setSettings({ ...settings, leaderboardVisible: e.target.checked })}
              className="rounded border-[var(--border)] bg-[var(--bg-elevated)] text-[#00F0FF] focus:ring-0"
            />
            <div>
              <span className="text-xs font-semibold text-[var(--fg)]">Show on Public Leaderboard</span>
              <p className="text-[11px] text-[var(--fg-muted)]">
                When disabled, your rank and score are hidden from public rankings.
              </p>
            </div>
          </label>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-6">
          {statusMessage && (
            <p className="text-xs font-medium text-[#39FF14]">{statusMessage}</p>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={saveLoading}
            className="flex items-center gap-2 rounded-lg bg-[#00F0FF] px-6 py-2.5 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            {saveLoading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--fg-muted)]" />
          <h3 className="text-sm font-bold text-[var(--fg)]">OAuth Provider Linkage</h3>
        </div>
        <p className="text-xs text-[var(--fg-muted)]">
          Authenticated via <strong className="text-[var(--fg)] capitalize">{settings.provider}</strong> OAuth. No password is stored or required.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-[#FF4D6D]/30 bg-[var(--bg-surface)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#FF4D6D]" />
          <h3 className="text-sm font-bold text-[#FF4D6D]">Danger Zone</h3>
        </div>
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          Permanently remove your account, practice history, XP, and streaks. This operation is immediate and irreversible.
        </p>
        <button
          onClick={() => {
            setIsDeleteModalOpen(true);
            setDeleteConfirmationInput("");
            setDeleteError("");
          }}
          className="flex items-center gap-1.5 rounded-lg border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 px-4 py-2 text-xs font-bold text-[#FF4D6D] hover:bg-[#FF4D6D]/20 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Account Permanently
        </button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#FF4D6D]/40 bg-[var(--bg-surface)] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#FF4D6D]">
              Confirm Permanent Account Deletion
            </h3>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              All personal data, progress, and submissions will be deleted. To proceed, please type <strong className="text-[var(--fg)] font-mono">DELETE</strong> in the box below:
            </p>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-xs font-mono text-[#FF4D6D] focus:border-[#FF4D6D] focus:outline-none"
            />

            {deleteError && (
              <p className="text-xs text-[#FF4D6D] font-medium">{deleteError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmationInput !== "DELETE"}
                className="rounded-lg bg-[#FF4D6D] px-4 py-1.5 text-xs font-bold text-[var(--fg)] hover:bg-[#FF4D6D]/90 disabled:opacity-50 transition"
              >
                {deleteLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
