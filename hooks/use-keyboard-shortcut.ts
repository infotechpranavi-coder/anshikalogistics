"use client";

import { useEffect, useRef } from "react";

export function useKeyboardShortcut(keys: string[], callback: () => void, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    if (!enabled) return;
    const expected = new Set(keys.map((key) => key.toLowerCase()));
    const listener = (event: KeyboardEvent) => {
      const pressed = new Set<string>([event.key.toLowerCase()]);
      if (event.ctrlKey) pressed.add("ctrl");
      if (event.metaKey) pressed.add("meta");
      if (event.altKey) pressed.add("alt");
      if (event.shiftKey) pressed.add("shift");
      if ([...expected].every((key) => pressed.has(key))) {
        event.preventDefault();
        callbackRef.current();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled, keys]);
}
