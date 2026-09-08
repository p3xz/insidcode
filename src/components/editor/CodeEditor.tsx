"use client";

import React, { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

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

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;

    // Define custom insidcode dark theme
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

    monaco.editor.setTheme("insidcode-dark");
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

  return (
    <div className="h-full w-full overflow-hidden bg-[#090A0F]">
      <Editor
        height="100%"
        language={getMonacoLang(language)}
        value={code}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        theme="vs-dark"
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
