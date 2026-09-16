"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        border: "1.5px solid var(--border-strong)",
        backgroundColor: isDark ? "#0E1528" : "#7CC8F5",
        cursor: "pointer",
        flexShrink: 0,
        overflow: "hidden",
        transition: "background-color 400ms ease, border-color 200ms ease",
        outline: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: isDark ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      >
        <span style={{ position: "absolute", top: "4px",  left: "6px",  width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.65)" }} />
        <span style={{ position: "absolute", top: "10px", left: "10px", width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.45)" }} />
        <span style={{ position: "absolute", top: "6px",  left: "18px", width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.55)" }} />
      </span>

      <span
        aria-hidden
        style={{
          position: "absolute",
          right: "5px",
          top: "7px",
          width: "11px",
          height: "6px",
          borderRadius: "10px",
          backgroundColor: "rgba(255,255,255,0.85)",
          opacity: isDark ? 0 : 1,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Sun / Moon thumb */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          width: "17px",
          height: "17px",
          borderRadius: "50%",
          left: isDark ? "calc(100% - 20px)" : "2px",
          backgroundColor: isDark ? "#CDD0E8" : "#FBBF24",
          boxShadow: isDark
            ? "inset -3px -1px 0 1.5px #9499C0"
            : "0 0 0 1.5px rgba(251,191,36,0.4)",
          transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms ease, box-shadow 300ms ease",
        }}
      />
    </button>
  );
}
