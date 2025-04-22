"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";

interface FileSectionProps {
  title: string;
  file: { name: string; url: string } | null;
  onUpload: React.ChangeEventHandler<HTMLInputElement>;
  onDownload: () => void;
}

const FileSection: React.FC<FileSectionProps> = ({ title, file, onUpload, onDownload }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <h4 className="font-bold">{title}</h4>
      <div className="flex items-center gap-1">
        <label className="cursor-pointer inline-flex items-center p-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload
          <input type="file" className="sr-only" onChange={onUpload} />
        </label>
        <Button variant="ghost" size="sm" className="p-1 h-auto text-sm" disabled={!file} onClick={onDownload}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Download
        </Button>
      </div>
    </div>
    {file ? (
      <div
        className="mb-2 text-sm truncate bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border dark:border-gray-700"
        title={file.name}
      >
        {file.name}
      </div>
    ) : (
      <div className="mb-2 text-sm text-muted-foreground bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border border-dashed dark:border-gray-700">
        No file uploaded
      </div>
    )}
  </div>
);

export default FileSection;
