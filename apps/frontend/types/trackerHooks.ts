import { Job } from "./job";
import { TrackerData } from "./tracker";

export interface UseTrackerDataProps {
  initialPage: number;
  itemsPerPage: number;
}

export interface TrackerFilters {
  sortBy: string;
  sortDirection: string;
  searchTerm: string;
  showArchived: boolean;
  showPriorityOnly: boolean;
  groupByCompany: boolean;
  onlyNotApplied: boolean;
  recentOnly: boolean;
  roleFilter: string;
  selectedTag: string | null;
  filterNotApplied: boolean;
  filterWithinWeek: boolean;
  filterIntern: boolean;
  filterNewgrad: boolean;
}

export interface UseJobManagerProps {
  updateLocalJob: (id: number, updatedFields: Partial<Job>) => void;
  refreshData: () => Promise<void>;
  trackerData: TrackerData;
  setTrackerData: React.Dispatch<React.SetStateAction<TrackerData>>;
}

export interface UseBulkActionsProps {
  baseUrl: string;
  refreshData: () => Promise<void>;
}

export type FieldValueType = string | number | boolean | string[];
