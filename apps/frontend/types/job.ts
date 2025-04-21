import { StatusKey } from "@/lib/constants";

export type RoleType = "intern" | "newgrad";
export type JobStatus = StatusKey;

export interface Job {
  id: number;
  company: string;
  title: string;
  postedDate: string;
  link: string;
  statusIndex: number;
  status?: JobStatus;
  role_type?: RoleType;
  priority: boolean;
  isModifying: boolean;
  archived: boolean;
  deleted: boolean;
  atsScore?: number;
  tags?: string[];
  notes?: string;
  followerCount?: number;
}

export interface JobTableProps {
  jobs: Job[];
  currentPage: number;
  itemsPerPage: number;
  setTotalJobs: (total: number) => void;
  onUpdateJob: (jobId: number, updates: Partial<Job>) => void;
  onSaveJob: (jobId: number) => void;
  onCancelModifyJob: (jobId: number) => void;
  onArchiveJob?: (jobId: number) => void;
  onDeleteJob?: (jobId: number) => void;
  onTogglePriorityJob?: (jobId: number) => void;
  onUpdateJobStatusArrow?: (jobId: number, direction: number) => void;
  statusCounts: Record<string, number>;
  groupByCompany?: boolean;
  onFocusJob?: React.Dispatch<React.SetStateAction<number | null>>;
  isJobProcessing?: (id: number) => boolean;
}

export interface JobToolbarProps {
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  sortDirection: string;
  setSortDirection: React.Dispatch<React.SetStateAction<string>>;
  groupByCompany: boolean;
  setGroupByCompany: React.Dispatch<React.SetStateAction<boolean>>;
  showArchived: boolean;
  setShowArchived: React.Dispatch<React.SetStateAction<boolean>>;
  showPriorityOnly: boolean;
  setShowPriorityOnly: React.Dispatch<React.SetStateAction<boolean>>;
  onAddNewJob: () => void;
}

export interface JobRowProps {
  job: Job;
  updateStatus: (jobId: number, direction: number) => void;
  togglePriority: (jobId: number) => void;
  onModifyJob?: (jobId: number) => void;
  onArchiveJob?: (jobId: number) => void;
  onDeleteJob?: (jobId: number) => void;
  onFocus?: (jobId: number) => void;
  onUpdateJob: (jobId: number, patch: Partial<Job>) => void;
  isBeingProcessed?: boolean;
}

export interface JobActionsProps {
  priority: boolean;
  archived: boolean;
  onTogglePriority: () => void;
  onModify: () => void;
  onArchive: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export interface ModifyJobRowProps {
  job: Job;
  onUpdateJob: (id: number, updatedFields: Partial<Job>) => void;
  onSaveJob: (id: number) => void;
  onCancelModifyJob: (id: number) => void;
  updateStatus: (jobId: number, direction: number) => void;
}
