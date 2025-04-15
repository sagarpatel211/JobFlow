import React from "react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onGoToPage: (page: number) => void;
}

export function PaginationControls({ currentPage, totalPages, onNext, onPrev, onGoToPage }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={currentPage <= 1}>
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => onGoToPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={onNext} disabled={currentPage >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
