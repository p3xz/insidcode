"use client";

import React, { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { SkeletonEditor } from "@/components/ui/Skeleton";
import type { editor } from "monaco-editor";
import { useTheme } from "@/components/layout/ThemeProvider";

interface CodeEditorProps {
  language: string;
  code: string;
  onChange: (value: string) => void;
  fontSize?: number;
  minimap?: boolean;
  duelMode?: boolean;
  isSystemCodeUpdate?: () => boolean;
  onPasteBlocked?: (info: { chars: number; timestamp: number }) => void;
  onEditorKeystroke?: (info: { isBackspace: boolean; timestamp: number }) => void;
  onEditorContentDelta?: (info: { insertedChars: number; deletedChars: number; timestamp: number }) => void;
}

export function CodeEditor({
  language,
  code,
  onChange,
  fontSize = 14,
  minimap = false,
  duelMode = false,
  isSystemCodeUpdate,
  onPasteBlocked,
  onEditorKeystroke,
  onEditorContentDelta,
}: CodeEditorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const { resolvedTheme } = useTheme();
  const lastInternalCopyRef = useRef<string>("");
  const approvedInternalPasteUntilRef = useRef<number>(0);
  const lastBlockedReportAtRef = useRef<number>(0);
  const duelDisposablesRef = useRef<Array<{ dispose: () => void }>>([]);
  const duelCallbacksRef = useRef({
    duelMode,
    isSystemCodeUpdate,
    onPasteBlocked,
    onEditorKeystroke,
    onEditorContentDelta,
  });

  useEffect(() => {
    duelCallbacksRef.current = {
      duelMode,
      isSystemCodeUpdate,
      onPasteBlocked,
      onEditorKeystroke,
      onEditorContentDelta,
    };
  }, [duelMode, isSystemCodeUpdate, onPasteBlocked, onEditorKeystroke, onEditorContentDelta]);

  useEffect(() => {
    return () => {
      duelDisposablesRef.current.forEach((d) => d.dispose());
      duelDisposablesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(
      resolvedTheme === "light" ? "insidcode-light" : "insidcode-dark"
    );
  }, [resolvedTheme]);

  // Capture-phase beforeinput guard for mobile soft-keyboard clipboard bars (Android Gboard, iOS QuickType)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!duelMode || !el) return;

    const handleBeforeInput = (ev: Event) => {
      const inputEvent = ev as InputEvent;
      const inputType = inputEvent.inputType;
      if (
        inputType !== "insertFromPaste" &&
        inputType !== "insertFromPasteAsQuotation" &&
        inputType !== "insertFromDrop"
      ) {
        return;
      }

      const incomingText =
        inputEvent.data ?? inputEvent.dataTransfer?.getData("text/plain") ?? "";

      if (incomingText && lastInternalCopyRef.current && incomingText === lastInternalCopyRef.current) {
        approvedInternalPasteUntilRef.current = Date.now() + 250;
        return;
      }

      ev.preventDefault();
      ev.stopPropagation();

      const now = Date.now();
      if (now - lastBlockedReportAtRef.current > 150) {
        lastBlockedReportAtRef.current = now;
        duelCallbacksRef.current.onPasteBlocked?.({
          chars: incomingText.length || 1,
          timestamp: now,
        });
      }
    };

    el.addEventListener("beforeinput", handleBeforeInput, { capture: true });
    return () => {
      el.removeEventListener("beforeinput", handleBeforeInput, { capture: true });
    };
  }, [duelMode]);

  const reportPasteBlocked = (chars: number) => {
    const now = Date.now();
    if (now - lastBlockedReportAtRef.current > 150) {
      lastBlockedReportAtRef.current = now;
      duelCallbacksRef.current.onPasteBlocked?.({
        chars: Math.max(1, chars),
        timestamp: now,
      });
    }
  };

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;

    monaco.editor.defineTheme("insidcode-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5E667B", fontStyle: "italic" },
        { token: "keyword", foreground: "00F0FF", fontStyle: "bold" },
        { token: "string", foreground: "39FF14" },
        { token: "number", foreground: "F59E0B" },
        { token: "identifier", foreground: "F5F7FA" },
      ],
      colors: {
        "editor.background": "#090A0F",
        "editor.foreground": "#F5F7FA",
        "editor.lineHighlightBackground": "#11131A",
        "editorLineNumber.foreground": "#5E667B",
        "editorLineNumber.activeForeground": "#00F0FF",
        "editorCursor.foreground": "#00F0FF",
        "editor.selectionBackground": "#252936",
        "editor.inactiveSelectionBackground": "#181B24",
      },
    });

    monaco.editor.defineTheme("insidcode-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "0070F3", fontStyle: "bold" },
        { token: "string", foreground: "16A34A" },
        { token: "number", foreground: "D97706" },
        { token: "identifier", foreground: "111827" },
      ],
      colors: {
        "editor.background": "#F9FAFB",
        "editor.foreground": "#111827",
        "editor.lineHighlightBackground": "#F3F4F6",
        "editorLineNumber.foreground": "#9CA3AF",
        "editorLineNumber.activeForeground": "#0070F3",
        "editorCursor.foreground": "#0070F3",
        "editor.selectionBackground": "#DBEAFE",
        "editor.inactiveSelectionBackground": "#EFF6FF",
        "editorIndentGuide.background": "#E5E7EB",
        "editorIndentGuide.activeBackground": "#D1D5DB",
      },
    });

    monaco.editor.setTheme(
      resolvedTheme === "light" ? "insidcode-light" : "insidcode-dark"
    );

    duelDisposablesRef.current.forEach((d) => d.dispose());
    duelDisposablesRef.current = [];

    if (duelCallbacksRef.current.duelMode) {
      const modifierKeyCodes = new Set<number>([
        monaco.KeyCode.Shift,
        monaco.KeyCode.Ctrl,
        monaco.KeyCode.Alt,
        monaco.KeyCode.Meta,
        monaco.KeyCode.CapsLock,
      ]);

      duelDisposablesRef.current.push(
        editorInstance.onKeyDown((e) => {
          if (modifierKeyCodes.has(e.keyCode)) return;
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          const isBackspace =
            e.keyCode === monaco.KeyCode.Backspace || e.keyCode === monaco.KeyCode.Delete;
          duelCallbacksRef.current.onEditorKeystroke?.({
            isBackspace,
            timestamp: Date.now(),
          });
        })
      );

      duelDisposablesRef.current.push(
        editorInstance.onDidChangeModelContent((e) => {
          if (e.isFlush || e.isUndoing || e.isRedoing) return;

          let insertedChars = 0;
          let deletedChars = 0;
          let insertedText = "";
          for (const change of e.changes) {
            insertedChars += change.text.length;
            deletedChars += change.rangeLength;
            if (change.text.length > 0) {
              insertedText += change.text;
            }
          }

          const now = Date.now();
          if (insertedChars > 0 || deletedChars > 0) {
            duelCallbacksRef.current.onEditorContentDelta?.({
              insertedChars,
              deletedChars,
              timestamp: now,
            });
          }

          // Block & undo unexpected multi-character external paste insertions (e.g. mobile Gboard clipboard chips / DevTools)
          if (
            insertedChars > 0 &&
            !duelCallbacksRef.current.isSystemCodeUpdate?.() &&
            now > approvedInternalPasteUntilRef.current
          ) {
            const nonWhitespaceChars = insertedText.replace(/\s+/g, "").length;
            const nonEmptyLines = insertedText
              .split(/\r?\n/)
              .filter((line) => line.trim().length > 0).length;

            if (nonWhitespaceChars >= 18 || nonEmptyLines >= 2) {
              if (
                lastInternalCopyRef.current &&
                insertedText === lastInternalCopyRef.current
              ) {
                return;
              }

              setTimeout(() => {
                editorInstance.trigger("duel-anticheat", "undo", null);
              }, 0);
              reportPasteBlocked(insertedChars);
            }
          }
        })
      );

      duelDisposablesRef.current.push(
        editorInstance.onDidPaste((e) => {
          const now = Date.now();
          if (now <= approvedInternalPasteUntilRef.current) return;

          const model = editorInstance.getModel();
          const pastedText = model ? model.getValueInRange(e.range) : "";
          if (pastedText && lastInternalCopyRef.current && pastedText === lastInternalCopyRef.current) {
            return;
          }

          // Undo context-menu / clipboard-API paste that bypassed DOM onPaste
          if (pastedText.length > 0) {
            setTimeout(() => {
              editorInstance.trigger("duel-anticheat", "undo", null);
            }, 0);
            reportPasteBlocked(pastedText.length);
          }
        })
      );
    }
  };

  const getMonacoLang = (lang: string) => {
    switch (lang) {
      case "python":
        return "python";
      case "javascript":
        return "javascript";
      case "cpp":
        return "cpp";
      case "c":
        return "c";
      case "java":
        return "java";
      default:
        return "python";
    }
  };

  const bgColor = resolvedTheme === "light" ? "#F9FAFB" : "#090A0F";

  const captureInternalSelection = () => {
    if (!duelMode || !editorRef.current) return;
    const sel = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    if (sel && model) {
      const selectedText = model.getValueInRange(sel);
      if (selectedText) {
        lastInternalCopyRef.current = selectedText;
      }
    }
  };

  const handlePasteCapture = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!duelMode) return;
    const text = e.clipboardData?.getData("text/plain") || "";
    const hasTypes = Boolean(e.clipboardData?.types && e.clipboardData.types.length > 0);
    if (!text && !hasTypes) return;

    if (text && lastInternalCopyRef.current && text === lastInternalCopyRef.current) {
      approvedInternalPasteUntilRef.current = Date.now() + 250;
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    reportPasteBlocked(text.length || 1);
  };

  const handleDropCapture = (e: React.DragEvent<HTMLDivElement>) => {
    if (!duelMode) return;
    const text = e.dataTransfer?.getData("text/plain") || "";
    const hasFiles = Boolean(e.dataTransfer?.files && e.dataTransfer.files.length > 0);
    if (!text && !hasFiles) return;

    if (text && lastInternalCopyRef.current && text === lastInternalCopyRef.current) {
      approvedInternalPasteUntilRef.current = Date.now() + 250;
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    reportPasteBlocked(text.length || 1);
  };

  return (
    <div
      ref={wrapperRef}
      className="h-full w-full overflow-hidden"
      style={{ backgroundColor: bgColor }}
      onCopyCapture={captureInternalSelection}
      onCutCapture={captureInternalSelection}
      onPasteCapture={handlePasteCapture}
      onDropCapture={handleDropCapture}
    >
      <Editor
        height="100%"
        language={getMonacoLang(language)}
        value={code}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        loading={<SkeletonEditor className="absolute inset-0" />}
        options={{
          fontSize,
          minimap: { enabled: minimap },
          scrollBeyondLastLine: false,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontLigatures: true,
          cursorBlinking: "smooth",
          lineNumbersMinChars: 3,
          tabSize: 4,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          automaticLayout: true,
        }}
      />
    </div>
  );
}
