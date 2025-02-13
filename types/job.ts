export interface Job {
  id: number;
  company: string;
  title: string;
  postedDate: string;
  link: string;
  statusIndex: number;
  priority: boolean;
  isModifying: boolean;
  archived: boolean;
  deleted: boolean;
  followers?: string;
}

export interface JobTableProps {
  jobs: Job[];
  currentPage: number;
  itemsPerPage: number;
  setTotalJobs: (total: number) => void;
  onUpdateJob: (jobId: number, updates: Partial<Job>) => void;
  onSaveJob: (jobId: number) => void;
  onCancelModifyJob: (jobId: number) => void;
}

export interface JobToolbarProps {
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
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
}

export interface JobActionsProps {
  priority: boolean;
  onTogglePriority: () => void;
  onModify: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export interface ModifyJobRowProps {
  job: Job;
  onUpdateJob: (id: number, updatedFields: Partial<Job>) => void;
  onSaveJob: (id: number) => void;
  onCancelModifyJob: (id: number) => void;
  updateStatus: (jobId: number, direction: number) => void;
}
