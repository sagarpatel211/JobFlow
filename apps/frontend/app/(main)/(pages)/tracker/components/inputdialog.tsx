"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { InputDialogProps } from "@/types/trackerComponents";

const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  label,
  placeholder = "Enter value",
  defaultValue = 3,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}) => {
  const [value, setValue] = useState<string>(String(defaultValue));
  const [error, setError] = useState<string>("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(String(defaultValue));
      setError("");
      // Disable background scrolling when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      // Re-enable scrolling when dialog closes
      document.body.style.overflow = "";
    };
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    // Parse and validate the input
    const numValue = parseInt(value, 10);

    if (isNaN(numValue) || numValue <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    onConfirm(numValue);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  // Return null if not open
  if (!isOpen) return null;

  // Create a portal to render the dialog outside the normal DOM hierarchy
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" tabIndex={-1} onKeyDown={handleEscapeKey}>
      {/* Backdrop/overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog content */}
      <div
        className="fixed z-[51] w-full max-w-md p-6 rounded-lg border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Form */}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              {label}
            </Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder={placeholder}
              className="col-span-3"
              min="1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              autoFocus
            />
            {error && <div className="col-span-4 text-sm text-red-500 text-right">{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button variant="outline" onClick={handleClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText}
          </Button>
        </div>

        {/* Close button */}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 h-4 w-4"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default InputDialog;
