"use client";
import { useState, useEffect, useCallback } from "react";
import { format, isValid } from "date-fns";

export function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return "";
  try {
    if (dateStr.includes(".")) {
      const [day, month, year] = dateStr.split(".").map(Number);
      const parsed = new Date(year, month - 1, day);
      if (isValid(parsed)) {
        return format(parsed, "yyyy-MM-dd");
      }
    }
    const parsed = new Date(dateStr);
    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd");
    }
  } catch (e) {
    console.error("toInputDateFormat error:", e);
  }
  return "";
}

export function toBackendDateFormat(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (isValid(parsed)) {
      return format(parsed, "dd.MM.yyyy");
    }
  } catch (e) {
    console.error("toBackendDateFormat error:", e);
  }
  return "";
}

export function useDateInput(initialDate: string, onUpdate: (newDate: string) => void) {
  const [inputValue, setInputValue] = useState<string>(() => toInputDateFormat(initialDate));

  useEffect(() => {
    setInputValue(toInputDateFormat(initialDate));
  }, [initialDate]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const htmlDate = e.target.value;
      setInputValue(htmlDate);
      if (htmlDate) {
        const backendDate = toBackendDateFormat(htmlDate);
        if (backendDate) {
          onUpdate(backendDate);
        }
      }
    },
    [onUpdate],
  );

  return [inputValue, handleChange] as const;
}
