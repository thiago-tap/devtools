"use client";

import { useCallback, useEffect, useState } from "react";

export function useQueryParamState(name: string, initialValue = "") {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get(name);
    if (current !== null) setValue(current);
  }, [name]);

  const setSharedValue = useCallback(
    (next: string) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next) url.searchParams.set(name, next);
      else url.searchParams.delete(name);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [name],
  );

  return [value, setSharedValue] as const;
}
