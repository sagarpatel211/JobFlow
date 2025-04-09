export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}

export interface PaginationData {
  totalJobs: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
