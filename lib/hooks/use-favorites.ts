"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "devtoolbox-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setFavorites(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setFavorites([]);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((ids: string[]) => {
    setFavorites(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const toggle = useCallback(
    (toolId: string) => {
      persist(
        favorites.includes(toolId)
          ? favorites.filter((id) => id !== toolId)
          : [...favorites, toolId]
      );
    },
    [favorites, persist]
  );

  const isFavorite = useCallback((toolId: string) => favorites.includes(toolId), [favorites]);

  return { favorites, loaded, toggle, isFavorite };
}
