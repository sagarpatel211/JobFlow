"use client";
import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";

export const TableLoadingSkeleton: React.FC = () => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="text-left">
            <TableHead>Company &amp; Job Title</TableHead>
            <TableHead>Posted Date</TableHead>
            <TableHead>Link</TableHead>
            <TableHead>Application Status</TableHead>
            <TableHead>Information</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, index) => (
            <TableRow key={index} className="animate-pulse">
              <TableCell colSpan={6} className="px-4 py-3">
                <div className="h-12 bg-zinc-800/40 dark:bg-zinc-700/40 rounded w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-16 bg-zinc-900 rounded w-full" />
      <div className="h-20 bg-zinc-900 rounded w-full" />
      <div className="h-72 bg-zinc-900 rounded w-full" />
      <div className="flex gap-4">
        <div className="h-40 bg-zinc-900 rounded w-1/2" />
        <div className="h-40 bg-zinc-900 rounded w-1/2" />
      </div>
    </div>
  );
};
