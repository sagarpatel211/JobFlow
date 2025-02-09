export interface Job {
  id: number;
  company: string;
  title: string;
  postedDate: string;
  link: string;
  statusIndex: number;
  priority: boolean;
  isEditing: boolean;
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
  onCancelEditJob: (jobId: number) => void;
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

export interface AddJobProps {
  onAddJob: (newJobFields: {
    company: string;
    title: string;
    postedDate: string;
    link: string;
    statusIndex: number;
    priority: boolean;
  }) => void;
  onCancelAdd: () => void;
}

export interface JobRowProps {
  job: Job;
  updateStatus: (jobId: number, direction: number) => void;
  togglePriority: (jobId: number) => void;
  onEditJob?: (jobId: number) => void;
  onArchiveJob?: (jobId: number) => void;
  onDeleteJob?: (jobId: number) => void;
}

export interface JobActionsProps {
  priority: boolean;
  onTogglePriority: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export interface EditJobRowProps {
  job: Job;
  onUpdateJob: (id: number, updatedFields: Partial<Job>) => void;
  onSaveJob: (id: number) => void;
  onCancelEditJob: (id: number) => void;
  updateStatus: (jobId: number, direction: number) => void;
}
