"use client";

import React, { useState, useEffect } from "react";
import { IQuestion, SubmissionStatus } from "@/types";
import { SUPPORTED_LANGUAGES, SupportedLanguageId } from "@/lib/constants";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { TerminalOutput, ExecutionResultData } from "@/components/editor/TerminalOutput";
import {
  Play,
  Send,
  CheckCircle2,
  FileText,
  Code2,
  Terminal,
  RotateCcw,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface ProblemWorkspaceProps {
  problem: IQuestion;
  initialSolved?: boolean;
}

export function ProblemWorkspace({ problem, initialSolved = false }: ProblemWorkspaceProps) {
  const { data: session } = useSession();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguageId>("python");
  const [code, setCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>("");
  const [activeMobileTab, setActiveMobileTab] = useState<"problem" | "code" | "terminal">("problem");

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResultData | null>(null);
  const [isSolved, setIsSolved] = useState(initialSolved);

  // Unsaved code prompt modal
  const [pendingLanguage, setPendingLanguage] = useState<SupportedLanguageId | null>(null);
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);

  // Load starter template or cached code
  useEffect(() => {
    const savedCodeKey = `code_${problem.problemId}_${selectedLanguage}`;
    const saved = localStorage.getItem(savedCodeKey);

    if (saved) {
      setCode(saved);
    } else {
      const template =
        problem.starterTemplates?.[selectedLanguage] ||
        `# Write your solution for ${problem.title} here\n`;
      setCode(template);
    }
  }, [problem, selectedLanguage]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    localStorage.setItem(`code_${problem.problemId}_${selectedLanguage}`, newCode);
  };

  const handleLanguageSelect = (lang: SupportedLanguageId) => {
    if (lang === selectedLanguage) return;

    const defaultTemplate = problem.starterTemplates?.[selectedLanguage] || "";
    const isCodeModified = code.trim() !== defaultTemplate.trim();

    if (isCodeModified) {
      setPendingLanguage(lang);
      setShowLanguageWarning(true);
    } else {
      setSelectedLanguage(lang);
    }
  };

  const confirmLanguageSwitch = () => {
    if (pendingLanguage) {
      setSelectedLanguage(pendingLanguage);
      setPendingLanguage(null);
    }
    setShowLanguageWarning(false);
  };

  const handleResetCode = () => {
    const template =
      problem.starterTemplates?.[selectedLanguage] ||
      `# Write your solution for ${problem.title} here\n`;
    setCode(template);
    localStorage.removeItem(`code_${problem.problemId}_${selectedLanguage}`);
  };

  const handleRunCode = async () => {
    // Prevent duplicate requests while execution is in-flight
    if (isRunning || isSubmitting) return;

    if (!session?.user) {
      alert("Please sign in to run code.");
      return;
    }

    setIsRunning(true);
    setActiveMobileTab("terminal");
    setExecResult(null);

    try {
      const stdin = customInput || (problem.examples[0]?.input ?? "");
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          customInput: stdin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setExecResult({
            systemError: data.error || "Rate limit exceeded. Maximum 10 runs per 10 minutes (50/hr). Please wait.",
          });
        } else {
          setExecResult({ systemError: data.error || "Failed to execute code" });
        }
        return;
      }

      const executionId = data.executionId;
      if (!executionId) {
        // Direct execution result fallback if API returned sync result directly
        if (data.status) {
          setExecResult({
            stdout: data.stdout,
            stderr: data.stderr,
            output: data.output,
            errorDetails: data.compilationError || data.runtimeError || data.systemError,
            status: data.compilationError
              ? "Compilation Error"
              : data.runtimeError
              ? "Runtime Error"
              : data.isTimeout || data.status === "timeout"
              ? "Time Limit Exceeded"
              : "Accepted",
          });
          return;
        }
        setExecResult({ systemError: "Failed to queue execution. Missing execution ID." });
        return;
      }

      // Poll status endpoint until execution reaches a terminal state
      const terminalStates = ["success", "error", "timeout", "failed", "cancelled"];
      let completed = false;
      const startTime = Date.now();
      const MAX_POLL_TIME = 45000; // 45s safety limit

      while (!completed && Date.now() - startTime < MAX_POLL_TIME) {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const statusRes = await fetch(`/api/execute/status?id=${encodeURIComponent(executionId)}`);
        if (!statusRes.ok) {
          const errData = await statusRes.json().catch(() => ({}));
          setExecResult({
            systemError: errData.error || "Failed to retrieve execution status.",
          });
          completed = true;
          break;
        }

        const statusData = await statusRes.json();
        if (terminalStates.includes(statusData.status)) {
          completed = true;
          setExecResult({
            stdout: statusData.stdout,
            stderr: statusData.stderr,
            output: statusData.output,
            errorDetails: statusData.compilationError || statusData.runtimeError || statusData.systemError,
            status: statusData.compilationError
              ? "Compilation Error"
              : statusData.runtimeError
              ? "Runtime Error"
              : statusData.isTimeout || statusData.status === "timeout"
              ? "Time Limit Exceeded"
              : statusData.status === "failed" || statusData.status === "cancelled"
              ? "System Error"
              : "Accepted",
          });
          break;
        }
      }

      if (!completed) {
        setExecResult({
          systemError: "Execution timed out waiting for results. Please try again.",
        });
      }
    } catch {
      setExecResult({
        systemError: "Code execution is temporarily unavailable. Please try again later.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!session?.user) {
      alert("Please sign in to submit your solution and record your progress.");
      return;
    }

    setIsSubmitting(true);
    setActiveMobileTab("terminal");
    setExecResult(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.problemId,
          language: selectedLanguage,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExecResult({ systemError: data.error || "Failed to process submission" });
      } else {
        setExecResult({
          status: data.status as SubmissionStatus,
          runtime: data.runtime,
          testsPassed: data.testsPassed,
          totalTests: data.totalTests,
          awardedXp: data.awardedXp,
          isFirstSolve: data.isFirstSolve,
          errorDetails: data.errorDetails,
        });

        if (data.status === "Accepted") {
          setIsSolved(true);
        }
      }
    } catch {
      setExecResult({
        systemError: "Submission processing failed. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full bg-[#090A0F] text-[#F5F7FA]">
      {/* Mobile Tab Switcher (Visible on < 1024px) */}
      <div className="flex lg:hidden items-center justify-between border-b border-[#252936] bg-[#11131A] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveMobileTab("problem")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeMobileTab === "problem"
                ? "bg-[#181B24] text-[#00F0FF]"
                : "text-[#8B93A7] hover:text-[#F5F7FA]"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Description
          </button>
          <button
            onClick={() => setActiveMobileTab("code")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeMobileTab === "code"
                ? "bg-[#181B24] text-[#00F0FF]"
                : "text-[#8B93A7] hover:text-[#F5F7FA]"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Code Editor
          </button>
          <button
            onClick={() => setActiveMobileTab("terminal")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeMobileTab === "terminal"
                ? "bg-[#181B24] text-[#00F0FF]"
                : "text-[#8B93A7] hover:text-[#F5F7FA]"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Console
          </button>
        </div>

        {isSolved && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#39FF14]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Solved
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane: Problem Description (Desktop: col-span-5, Mobile: controlled by activeTab) */}
        <div
          className={`h-full flex-col overflow-y-auto border-r border-[#252936] bg-[#090A0F] p-4 sm:p-6 lg:col-span-5 ${
            activeMobileTab === "problem" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Problem Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[#8B93A7] bg-[#181B24] px-2 py-0.5 rounded">
                #{problem.problemId}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  problem.difficulty === "Easy"
                    ? "text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30"
                    : problem.difficulty === "Medium"
                    ? "text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30"
                    : "text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/30"
                }`}
              >
                {problem.difficulty}
              </span>
              <span className="rounded bg-[#181B24] px-2 py-0.5 text-xs font-medium text-[#8B93A7]">
                Phase {problem.phase}
              </span>
              {isSolved && (
                <span className="flex items-center gap-1 text-xs font-semibold text-[#39FF14] ml-auto">
                  <CheckCircle2 className="h-4 w-4" />
                  Solved
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7FA]">
              {problem.title}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#8B93A7]">
              <span>Reward: <strong className="text-[#00F0FF]">+{problem.xp} XP</strong></span>
            </div>
          </div>

          {/* Problem Description */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#8B93A7] leading-relaxed mb-6 whitespace-pre-wrap font-sans">
            {problem.description}
          </div>

          {/* Examples */}
          {problem.examples && problem.examples.length > 0 && (
            <div className="mb-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F7FA]">
                Examples
              </h3>
              {problem.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-[#252936] bg-[#11131A] p-3 text-xs font-mono"
                >
                  <p className="font-semibold text-[#F5F7FA] mb-2 font-sans">Example {idx + 1}:</p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[#8B93A7]">Input:</span>
                      <pre className="mt-0.5 rounded bg-[#090A0F] p-2 text-[#F5F7FA] whitespace-pre-wrap">
                        {ex.input || "(no input)"}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[#8B93A7]">Output:</span>
                      <pre className="mt-0.5 rounded bg-[#090A0F] p-2 text-[#39FF14] whitespace-pre-wrap">
                        {ex.output}
                      </pre>
                    </div>
                    {ex.explanation && (
                      <p className="text-[11px] text-[#8B93A7] font-sans">
                        <strong>Explanation:</strong> {ex.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Constraints */}
          {problem.constraints && problem.constraints.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F7FA] mb-2">
                Constraints
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#8B93A7] font-mono">
                {problem.constraints.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Pane: Code Editor & Output Console (col-span-7) */}
        <div
          className={`h-full flex-col lg:col-span-7 ${
            activeMobileTab === "problem" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Editor Top Action Bar */}
          <div className="flex items-center justify-between border-b border-[#252936] bg-[#11131A] px-3 py-1.5">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="language-select" className="text-xs text-[#8B93A7]">Language:</label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => handleLanguageSelect(e.target.value as SupportedLanguageId)}
                className="rounded-md border border-[#252936] bg-[#181B24] px-2.5 py-1 text-xs font-medium text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCode}
                title="Reset code to starter template"
                className="flex items-center gap-1 rounded-md border border-[#252936] bg-[#181B24] px-2.5 py-1 text-xs text-[#8B93A7] hover:text-[#F5F7FA] transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 rounded-md border border-[#252936] bg-[#181B24] px-3 py-1 text-xs font-semibold text-[#F5F7FA] hover:bg-[#252936] disabled:opacity-50 transition"
              >
                <Play className="h-3.5 w-3.5 text-[#00F0FF]" />
                <span>{isRunning ? "Running..." : "Run"}</span>
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 rounded-md bg-[#00F0FF] px-3.5 py-1 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 disabled:opacity-50 transition shadow-lg shadow-[#00F0FF]/10"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Frame */}
          <div
            className={`flex-1 overflow-hidden min-h-[300px] ${
              activeMobileTab === "terminal" ? "hidden lg:block" : "block"
            }`}
          >
            <CodeEditor
              language={selectedLanguage}
              code={code}
              onChange={handleCodeChange}
            />
          </div>

          {/* Terminal / Output Split Pane */}
          <div
            className={`h-64 border-t border-[#252936] overflow-hidden ${
              activeMobileTab === "code" ? "hidden lg:block" : "block"
            }`}
          >
            <TerminalOutput
              result={execResult}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              customInput={customInput}
              onCustomInputChange={setCustomInput}
            />
          </div>
        </div>
      </div>

      {/* Language Switch Confirmation Warning Modal */}
      {showLanguageWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[#252936] bg-[#11131A] p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-[#F5F7FA] mb-2">
              Switch Language?
            </h3>
            <p className="text-xs text-[#8B93A7] leading-relaxed mb-4">
              Switching languages will load the starter template for the selected language. Your current code will be saved in your browser history.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLanguageWarning(false)}
                className="rounded-md border border-[#252936] bg-[#181B24] px-3 py-1.5 text-xs text-[#8B93A7] hover:text-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                onClick={confirmLanguageSwitch}
                className="rounded-md bg-[#00F0FF] px-3.5 py-1.5 text-xs font-bold text-[#090A0F]"
              >
                Switch Language
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
