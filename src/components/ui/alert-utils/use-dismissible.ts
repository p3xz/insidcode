"use client";

import * as React from "react";

export function useDismissible(
  key: string,
  { storage }: { storage: "local" | "session" }
): { open: boolean; dismiss: () => void } {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    if (!key) {
      setOpen(true);
      return;
    }

    try {
      const store =
        storage === "session" ? window.sessionStorage : window.localStorage;
      const storedValue = store.getItem(key);
      setOpen(storedValue !== "dismissed");
    } catch {
      // Ignore storage access errors (private browsing / quota / SSR)
    }
  }, [key, storage]);

  const dismiss = React.useCallback(() => {
    if (!key) {
      return;
    }

    setOpen(false);
    try {
      const store =
        storage === "session" ? window.sessionStorage : window.localStorage;
      store.setItem(key, "dismissed");
    } catch {
      // Ignore storage write errors
    }
  }, [key, storage]);

  if (!key) {
    return { open: true, dismiss: () => {} };
  }

  return { open, dismiss };
}
