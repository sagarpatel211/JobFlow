import { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useDebouncedUpdate<T>(callback: (value: T) => void, delay: number = 500) {
  const debouncedCallback = useDebouncedCallback((value: T) => {
    callback(value);
  }, delay);

  return useCallback(debouncedCallback, [debouncedCallback]);
}
