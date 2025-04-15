"use client";
import React, { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationControlsProps } from "@/types/pagination";

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPrev, onNext, onGoToPage }) => {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, "");
    setPageInput(sanitized);
  }, []);

  const handleGoToPage = useCallback(() => {
    const isValidPage = (page: number) => page >= 1 && page <= totalPages;

    const pageNumber = Number(pageInput);

    if (isValidPage(pageNumber)) {
      onGoToPage(pageNumber);
    } else {
      setPageInput(String(currentPage));
    }
  }, [pageInput, onGoToPage, currentPage, totalPages]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleGoToPage();
      }
    },
    [handleGoToPage],
  );

  const parsedInput = Number(pageInput);
  const disableGoButton = pageInput === "" || parsedInput === currentPage || parsedInput < 1 || parsedInput > totalPages;

  return (
    <div className="flex justify-between items-center px-6 py-4">
      <Button variant="outline" disabled={currentPage === 1} onClick={onPrev} className="flex items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm">Page</span>
        <div className="flex items-center gap-2">
          <Input
            className="w-16 text-center"
            value={pageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleGoToPage}
          />
          <span className="text-sm">of {totalPages || 1}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleGoToPage} disabled={disableGoButton}>
          Go
        </Button>
      </div>

      <Button
        variant="outline"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={onNext}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PaginationControls;
