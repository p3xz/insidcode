"use client";

import React, { useState, useEffect } from "react";
import { IQuestion, DifficultyLevel } from "@/types";
import { generateDefaultStarterTemplates } from "@/lib/starterTemplates";

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Loader2,
  Save,
  X,
} from "lucide-react";

export function AdminProblemManagement() {
  const [problems, setProblems] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");

  const [isEditing, setIsEditing] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Partial<IQuestion> | null>(null);
  const [isNewProblem, setIsNewProblem] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProblems = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (phaseFilter) params.set("phase", phaseFilter);
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/problems?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProblems(data.questions || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, phaseFilter, difficultyFilter]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleOpenCreate = () => {
    const nextNum = (problems.length + 1).toString().padStart(3, "0");
    const defaultTemplates = generateDefaultStarterTemplates("New Problem");

    setEditingProblem({
      problemId: nextNum,
      title: "",
      slug: "",
      phase: 1,
      difficulty: "Easy",
      description: "Problem statement here...",
      constraints: ["1 <= N <= 10^5"],
      examples: [{ input: "1", output: "1", explanation: "Sample explanation" }],
      starterTemplates: defaultTemplates,
      tags: ["Phase 1"],
      xp: 10,
      hiddenTestCases: [{ input: "1", expectedOutput: "1" }],
      isPublished: true,
    });
    setIsNewProblem(true);
    setIsEditing(true);
    setErrorMessage("");
  };

  const handleOpenEdit = (prob: IQuestion) => {
    setEditingProblem({ ...prob });
    setIsNewProblem(false);
    setIsEditing(true);
    setErrorMessage("");
  };

  const handleTogglePublish = async (prob: IQuestion) => {
    try {
      const res = await fetch(`/api/admin/problems/${prob.problemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !prob.isPublished }),
      });
      if (res.ok) {
        setProblems((prev) =>
          prev.map((p) => (p.problemId === prob.problemId ? { ...p, isPublished: !p.isPublished } : p))
        );
      }
    } catch {
      alert("Failed to toggle publish status");
    }
  };

  const handleDelete = async (prob: IQuestion) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Problem ${prob.problemId}: "${prob.title}"?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/problems/${prob.problemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProblems((prev) => prev.filter((p) => p.problemId !== prob.problemId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete problem");
      }
    } catch {
      alert("Error deleting problem");
    }
  };

  const handleSaveProblem = async () => {
    if (!editingProblem?.title || !editingProblem?.problemId) {
      setErrorMessage("Title and Problem ID are required.");
      return;
    }

    setSaveLoading(true);
    setErrorMessage("");

    try {
      const url = isNewProblem ? "/api/admin/problems" : `/api/admin/problems/${editingProblem.problemId}`;
      const method = isNewProblem ? "POST" : "PUT";

      const cleanSlug = editingProblem.slug || slugifyTitle(editingProblem.title);

      const payload = {
        ...editingProblem,
        slug: cleanSlug,
        xp:
          editingProblem.difficulty === "Hard"
            ? 30
            : editingProblem.difficulty === "Medium"
            ? 20
            : 10,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save problem.");
      } else {
        setIsEditing(false);
        fetchProblems();
      }
    } catch {
      setErrorMessage("Network error while saving problem.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#F5F7FA]">Question Management</h2>
          <p className="text-xs text-[#8B93A7]">
            Create, edit, manage test cases, and publish coding challenges across all six phases.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-lg bg-[#00F0FF] px-3.5 py-2 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 transition"
        >
          <Plus className="h-4 w-4" />
          Create New Problem
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8B93A7]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems by ID, title, or tag..."
            className="w-full rounded-lg border border-[#252936] bg-[#11131A] py-2 pl-9 pr-4 text-xs text-[#F5F7FA] placeholder-[#5E667B] focus:border-[#00F0FF] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="w-full rounded-lg border border-[#252936] bg-[#11131A] py-2 px-3 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
          >
            <option value="">All Phases (1-6)</option>
            <option value="1">Phase 1: Conditional</option>
            <option value="2">Phase 2: Looping</option>
            <option value="3">Phase 3: Recursion</option>
            <option value="4">Phase 4: Arrays</option>
            <option value="5">Phase 5: Strings</option>
            <option value="6">Phase 6: Mixed</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full rounded-lg border border-[#252936] bg-[#11131A] py-2 px-3 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Problems Table */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : problems.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8B93A7]">
            No problems found matching criteria. Click &quot;Create New Problem&quot; to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#252936] bg-[#181B24]/70 font-mono text-[#8B93A7]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">XP</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936]/60 text-[#F5F7FA]">
                {problems.map((prob) => (
                  <tr key={prob.problemId} className="hover:bg-[#181B24]/40 transition">
                    <td className="px-4 py-3 font-mono text-[#00F0FF]">{prob.problemId}</td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex flex-col">
                        <span>{prob.title}</span>
                        <span className="font-mono text-[10px] text-[#5E667B]">/{prob.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#181B24] px-2 py-0.5 text-[11px] text-[#8B93A7]">
                        Phase {prob.phase}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          prob.difficulty === "Easy"
                            ? "text-[#39FF14] bg-[#39FF14]/10"
                            : prob.difficulty === "Medium"
                            ? "text-[#F59E0B] bg-[#F59E0B]/10"
                            : "text-[#FF4D6D] bg-[#FF4D6D]/10"
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#00F0FF]">+{prob.xp}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePublish(prob)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                          prob.isPublished
                            ? "text-[#39FF14] bg-[#39FF14]/10 hover:bg-[#39FF14]/20"
                            : "text-[#5E667B] bg-[#181B24] hover:bg-[#252936]"
                        }`}
                      >
                        {prob.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {prob.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(prob)}
                          className="rounded p-1.5 text-[#8B93A7] hover:bg-[#181B24] hover:text-[#00F0FF] transition"
                          title="Edit Problem"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prob)}
                          className="rounded p-1.5 text-[#8B93A7] hover:bg-[#181B24] hover:text-[#FF4D6D] transition"
                          title="Delete Problem"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Problem Full Modal */}
      {isEditing && editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl border border-[#252936] bg-[#11131A] shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-[#252936] px-6 py-4">
              <h3 className="text-base font-bold text-[#F5F7FA]">
                {isNewProblem ? "Create Problem" : `Edit Problem #${editingProblem.problemId}`}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded p-1 text-[#8B93A7] hover:bg-[#181B24] hover:text-[#F5F7FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5 text-xs">
              {errorMessage && (
                <div className="rounded-lg border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 p-3 text-[#FF4D6D]">
                  {errorMessage}
                </div>
              )}

              {/* ID, Title, Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-[#8B93A7] font-semibold">ID (e.g. 001)</label>
                  <input
                    type="text"
                    value={editingProblem.problemId || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, problemId: e.target.value })}
                    className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-[#F5F7FA] font-mono focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block mb-1 text-[#8B93A7] font-semibold">Problem Title</label>
                  <input
                    type="text"
                    value={editingProblem.title || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                    className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block mb-1 text-[#8B93A7] font-semibold">URL Slug</label>
                  <input
                    type="text"
                    value={editingProblem.slug || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, slug: e.target.value })}
                    placeholder="auto-generated from title"
                    className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-[#F5F7FA] font-mono focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Phase, Difficulty, Publish */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-[#8B93A7] font-semibold">Curriculum Phase</label>
                  <select
                    value={editingProblem.phase || 1}
                    onChange={(e) => setEditingProblem({ ...editingProblem, phase: parseInt(e.target.value, 10) })}
                    className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value={1}>Phase 1: Conditional Thinking</option>
                    <option value={2}>Phase 2: Looping & Patterns</option>
                    <option value={3}>Phase 3: Recursion</option>
                    <option value={4}>Phase 4: Basic Arrays</option>
                    <option value={5}>Phase 5: Strings</option>
                    <option value={6}>Phase 6: Mixed Logical Challenges</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-[#8B93A7] font-semibold">Difficulty</label>
                  <select
                    value={editingProblem.difficulty || "Easy"}
                    onChange={(e) =>
                      setEditingProblem({
                        ...editingProblem,
                        difficulty: e.target.value as DifficultyLevel,
                      })
                    }
                    className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value="Easy">Easy (10 XP)</option>
                    <option value="Medium">Medium (20 XP)</option>
                    <option value="Hard">Hard (30 XP)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-[#8B93A7] font-semibold">Publish Status</label>
                  <select
                    value={editingProblem.isPublished ? "true" : "false"}
                    onChange={(e) =>
                      setEditingProblem({ ...editingProblem, isPublished: e.target.value === "true" })
                    }
                    className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value="true">Published (Visible in directory)</option>
                    <option value="false">Draft (Admin only)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 text-[#8B93A7] font-semibold">Problem Statement</label>
                <textarea
                  rows={5}
                  value={editingProblem.description || ""}
                  onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
                  className="w-full rounded-md border border-[#252936] bg-[#181B24] p-3 text-[#F5F7FA] font-sans focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              {/* Hidden Test Cases Section */}
              <div className="rounded-lg border border-[#252936] bg-[#090A0F] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-[#00F0FF] uppercase tracking-wider text-[11px]">
                    Hidden Test Cases (Server Evaluated)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingProblem.hiddenTestCases || [];
                      setEditingProblem({
                        ...editingProblem,
                        hiddenTestCases: [...current, { input: "", expectedOutput: "" }],
                      });
                    }}
                    className="flex items-center gap-1 rounded bg-[#181B24] px-2 py-1 text-[11px] text-[#00F0FF] hover:bg-[#252936]"
                  >
                    <Plus className="h-3 w-3" /> Add Test Case
                  </button>
                </div>

                <div className="space-y-3">
                  {editingProblem.hiddenTestCases?.map((tc, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded bg-[#11131A] p-3 border border-[#252936]">
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-[10px] text-[#8B93A7] font-mono">Test {idx + 1} Input:</label>
                          <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...(editingProblem.hiddenTestCases || [])];
                              updated[idx].input = e.target.value;
                              setEditingProblem({ ...editingProblem, hiddenTestCases: updated });
                            }}
                            className="w-full rounded bg-[#181B24] p-1.5 font-mono text-xs text-[#F5F7FA] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#8B93A7] font-mono">Expected Output:</label>
                          <textarea
                            rows={2}
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const updated = [...(editingProblem.hiddenTestCases || [])];
                              updated[idx].expectedOutput = e.target.value;
                              setEditingProblem({ ...editingProblem, hiddenTestCases: updated });
                            }}
                            className="w-full rounded bg-[#181B24] p-1.5 font-mono text-xs text-[#39FF14] focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingProblem.hiddenTestCases?.filter((_, i) => i !== idx);
                          setEditingProblem({ ...editingProblem, hiddenTestCases: updated });
                        }}
                        className="rounded p-1 text-[#8B93A7] hover:text-[#FF4D6D]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#252936] bg-[#181B24]/50 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-[#252936] bg-[#11131A] px-4 py-2 text-xs font-semibold text-[#8B93A7] hover:text-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProblem}
                disabled={saveLoading}
                className="flex items-center gap-1.5 rounded-lg bg-[#00F0FF] px-5 py-2 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saveLoading ? "Saving..." : "Save Problem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
