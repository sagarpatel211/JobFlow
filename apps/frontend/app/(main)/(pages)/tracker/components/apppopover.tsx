"use client";
import React, { useState, KeyboardEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";

interface ApplicationPopoverProps {
  job: { atsScore?: number };
  resumeFile: File | null;
  coverLetterFile: File | null;
  handleResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverLetterUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadFile: (file: File) => void;
}

const ApplicationPopover: React.FC<ApplicationPopoverProps> = ({
  job,
  resumeFile,
  coverLetterFile,
  handleResumeUpload,
  handleCoverLetterUpload,
  downloadFile,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  return (
    <PopoverContent className="p-4 w-72 bg-white bg-opacity-100 backdrop-blur-3xl">
      <div className="space-y-4">
        <div>
          <h4 className="font-bold mb-1">Resume</h4>
          {resumeFile ? (
            <div className="mb-2 text-sm truncate" title={resumeFile.name}>
              {resumeFile.name}
            </div>
          ) : (
            <div className="mb-2 text-sm text-muted-foreground">No file uploaded</div>
          )}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center px-2 py-1 border rounded">
              Upload
              <input type="file" className="hidden" onChange={handleResumeUpload} />
            </label>
            <Button
              variant="outline"
              size="sm"
              disabled={!resumeFile}
              onClick={() => resumeFile && downloadFile(resumeFile)}
            >
              Download
            </Button>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-1">Cover Letter</h4>
          {coverLetterFile ? (
            <div className="mb-2 text-sm truncate" title={coverLetterFile.name}>
              {coverLetterFile.name}
            </div>
          ) : (
            <div className="mb-2 text-sm text-muted-foreground">No file uploaded</div>
          )}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center px-2 py-1 border rounded">
              Upload
              <input type="file" className="hidden" onChange={handleCoverLetterUpload} />
            </label>
            <Button
              variant="outline"
              size="sm"
              disabled={!coverLetterFile}
              onClick={() => coverLetterFile && downloadFile(coverLetterFile)}
            >
              Download
            </Button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold">ATS Score</h4>
            <span className="text-sm font-medium">{job.atsScore || 0}</span>
          </div>
          <div className="relative h-4 w-full bg-gray-300 rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-green-500"
              style={{ width: `${job.atsScore || 0}%` }}
            />
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-1">Custom Tags</h4>
          <div className="overflow-x-auto flex gap-2 pb-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center rounded-full bg-blue-900 px-3 py-1 whitespace-nowrap text-white"
              >
                <span className="text-sm font-medium">{tag}</span>
                <button
                  type="button"
                  className="ml-2 text-xs text-white hover:text-gray-200"
                  onClick={() => removeTag(tag)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag..."
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <Button variant="outline" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </PopoverContent>
  );
};

export default ApplicationPopover;
