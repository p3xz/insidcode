"use client";

import React, { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "@/components/layout/ThemeProvider";

interface CodeEditorProps {
  language: string;
  code: string;
  onChange: (value: string) => void;
  fontSize?: number;
  minimap?: boolean;
}

export function CodeEditor({
  language,
  code,
  onChange,
  fontSize = 14,
  minimap = false,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(
      resolvedTheme === "light" ? "insidcode-light" : "insidcode-dark"
    );
  }, [resolvedTheme]);

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

  return (
    <div className="h-full w-full overflow-hidden" style={{ backgroundColor: bgColor }}>
      <Editor
        height="100%"
        language={getMonacoLang(language)}
        value={code}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
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
