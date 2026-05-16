"use client";

import { useCallback, useEffect, useState } from "react";

export interface ToolHistoryItem<T> {
  id: string;
  label: string;
  value: T;
  createdAt: string;
}

const MAX_ITEMS = 10;

export function useToolHistory<T>(toolId: string) {
  const key = `devtoolbox-history:${toolId}`;
  const [items, setItems] = useState<ToolHistoryItem<T>[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setItems(raw ? (JSON.parse(raw) as ToolHistoryItem<T>[]) : []);
    } catch {
      setItems([]);
    }
  }, [key]);

  const persist = useCallback(
    (next: ToolHistoryItem<T>[]) => {
      setItems(next);
      localStorage.setItem(key, JSON.stringify(next));
    },
    [key],
  );

  const add = useCallback(
    (label: string, value: T) => {
      const item = {
        id: crypto.randomUUID(),
        label,
        value,
        createdAt: new Date().toISOString(),
      };
      persist([item, ...items].slice(0, MAX_ITEMS));
    },
    [items, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, add, clear };
}
