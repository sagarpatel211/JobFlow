"use client";
import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { ConfirmationDialogProps } from "@/types/trackerComponents";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

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
  useBodyScrollLock(isOpen);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const handleEscapeKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    },
    [handleCancel],
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" tabIndex={-1} onKeyDown={handleEscapeKey}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancel} />
      <div
        className="fixed z-[51] w-full max-w-md p-6 rounded-lg border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {icon ?? (variant === "destructive" && <AlertTriangle className="h-5 w-5 text-red-500" />)}
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
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
