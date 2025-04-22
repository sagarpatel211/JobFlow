import { ReactNode } from "react";
import { Job } from "./job";

export interface ChartsSectionProps {
  statusCounts: Record<string, number>;
}

export interface CustomTooltipPayload {
  name?: string;
  dataKey?: string;
  value?: number;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number;
    [key: string]: string | number | boolean | undefined;
  }>;
  label?: string;
}

export interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  defaultValue?: number;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  min?: number;
  max?: number;
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  icon?: ReactNode;
}

export interface TrackerHeaderProps {
  isHealthy: boolean;
  scraping: boolean;
  scrapeProgress: number;
  estimatedSeconds: number;
  onScrape: () => void;
  onDeleteOlderThan: (months: number) => void;
  onRemoveDeadLinks: () => void;
  onArchiveRejected: () => void;
  onArchiveAppliedOlderThan: (months: number) => void;
  onMarkOldestAsPriority: () => void;
}

export interface ApplicationPopoverProps {
  job: Job;
  resumeFile: { name: string; url: string } | null;
  coverLetterFile: { name: string; url: string } | null;
  handleResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverLetterUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadFile: (attachment: { name: string; url: string } | null) => void;
  onUpdateJob: (id: number, patch: Partial<Job>) => void;
}
