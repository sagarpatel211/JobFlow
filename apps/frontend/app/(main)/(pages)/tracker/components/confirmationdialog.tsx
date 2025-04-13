"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { ConfirmationDialogProps } from "@/types/trackerComponents";

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  icon,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Disable background scrolling when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      // Re-enable scrolling when dialog closes
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Return null if not open
  if (!isOpen) return null;

  // Create a portal to render the dialog outside the normal DOM hierarchy
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" tabIndex={-1} onKeyDown={handleEscapeKey}>
      {/* Backdrop/overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancel} />

      {/* Dialog content */}
      <div
        className="fixed z-[51] w-full max-w-md p-6 rounded-lg border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
            {icon || (variant === "destructive" && <AlertTriangle className="h-5 w-5 text-red-500" />)}
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>
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
          onClick={handleCancel}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmationDialog;
