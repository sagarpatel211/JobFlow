"use client";
import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationControlsProps } from "@/types/pagination";

const PaginationControls = ({ currentPage, totalPages, onPrev, onNext, onGoToPage }: PaginationControlsProps) => {
  const [pageInput, setPageInput] = useState<string>(String(currentPage));

  const handlePageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "");
    setPageInput(value);
  };

  const handlePageInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleGoToPage();
    }
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onGoToPage(pageNumber);
      setPageInput(String(pageNumber));
    } else {
      // Reset to current page if invalid
      setPageInput(String(currentPage));
    }
  };

  // Update the page input when currentPage changes externally
  React.useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  return (
    <div className="flex justify-between items-center px-6 py-4">
      <Button variant="outline" disabled={currentPage === 1} onClick={onPrev} className="flex items-center gap-2">
        <ChevronLeft className="h-4 w-4" /> Previous
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm">Page</span>
        <div className="flex items-center gap-2">
          <Input
            className="w-16 text-center"
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputKeyDown}
            onBlur={handleGoToPage}
          />
          <span className="text-sm">of {totalPages || 1}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoToPage}
          disabled={
            parseInt(pageInput, 10) === currentPage ||
            isNaN(parseInt(pageInput, 10)) ||
            parseInt(pageInput, 10) < 1 ||
            parseInt(pageInput, 10) > totalPages
          }
        >
          Go
        </Button>
      </div>

      <Button
        variant="outline"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={onNext}
        className="flex items-center gap-2"
      >
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PaginationControls;
