"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationControlsProps } from "@/types/pagination";

const PaginationControls = ({ currentPage, totalPages, onPrev, onNext }: PaginationControlsProps) => {
  return (
    <div className="flex justify-between items-center px-6 py-4">
      <Button variant="outline" disabled={currentPage === 1} onClick={onPrev} className="flex items-center gap-2">
        <ChevronLeft className="h-4 w-4" /> Previous
      </Button>

      <span className="text-sm">
        Page {currentPage} of {totalPages || 1}
      </span>

      <Button
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={onNext}
        className="flex items-center gap-2"
      >
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PaginationControls;
