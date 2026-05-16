"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_MAX_URL_VALUE_LENGTH = 2_000;

export function useQueryParamState(
  name: string,
  initialValue = "",
  maxUrlValueLength = DEFAULT_MAX_URL_VALUE_LENGTH,
) {
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
      if (next && next.length <= maxUrlValueLength) url.searchParams.set(name, next);
      else url.searchParams.delete(name);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [maxUrlValueLength, name],
  );

  return [value, setSharedValue] as const;
}
