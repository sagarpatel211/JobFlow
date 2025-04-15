"use client";
import React, { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import { ApplicationPopoverProps } from "@/types/trackerComponents";
import FileSection from "../../../../../components/ui/filesection";
import { updateJob } from "../services/api";
import { useDebouncedUpdate } from "../hooks/useDebouncedUpdate";

const ApplicationPopover: React.FC<ApplicationPopoverProps> = ({
  job,
  resumeFile,
  coverLetterFile,
  handleResumeUpload,
  handleCoverLetterUpload,
  downloadFile,
  updateTags,
  updateNotes,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(job.tags || []);
  const [notes, setNotes] = useState<string>(job.notes || "");

  useEffect(() => {
    setTags(job.tags || []);
    setNotes(job.notes || "");
  }, [job.tags, job.notes]);

  const debouncedUpdateTags = useDebouncedUpdate((newTags: string[]) => {
    if (updateTags) {
      updateTags(job.id, newTags);
    } else {
      void updateJob(job.id, { tags: newTags });
    }
  }, 500);

  const debouncedUpdateNotes = useDebouncedUpdate((newNotes: string) => {
    if (updateNotes && newNotes !== job.notes) {
      updateNotes(job.id, newNotes);
    } else if (newNotes !== job.notes) {
      void updateJob(job.id, { notes: newNotes });
    }
  }, 500);

  useEffect(() => {
    return () => {
      debouncedUpdateTags.flush();
      debouncedUpdateNotes.flush();
    };
  }, [debouncedUpdateTags, debouncedUpdateNotes]);

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;

    const newTags = [...tags, trimmed];
    setTags(newTags);
    setTagInput("");
    debouncedUpdateTags(newTags);
  }, [tagInput, tags, debouncedUpdateTags]);

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      if (newTags.length !== tags.length) {
        setTags(newTags);
        debouncedUpdateTags(newTags);
      }
    },
    [tags, debouncedUpdateTags],
  );

  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    debouncedUpdateNotes(newNotes);
  };

  return (
    <PopoverContent className="p-4 w-80 max-h-[80vh] overflow-y-auto bg-white bg-opacity-100 backdrop-blur-3xl">
      <div className="space-y-3.5">
        <FileSection
          title="Resume"
          file={resumeFile}
          onUpload={handleResumeUpload}
          onDownload={() => resumeFile && downloadFile(resumeFile)}
        />
        <FileSection
          title="Cover Letter"
          file={coverLetterFile}
          onUpload={handleCoverLetterUpload}
          onDownload={() => coverLetterFile && downloadFile(coverLetterFile)}
        />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-bold">ATS Score</h4>
            <span className="text-sm font-medium">{job.atsScore || 0}</span>
          </div>
          <div className="relative h-2.5 w-full bg-gray-300 dark:bg-zinc-700 rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-green-500"
              style={{ width: `${String(job.atsScore || 0)}%` }}
            />
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-1.5">Personal Notes</h4>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add personal notes about this job..."
            className="w-full h-16 p-2 border rounded text-sm resize-none dark:bg-zinc-800 dark:border-gray-700"
          />
        </div>
        <div>
          <h4 className="font-bold mb-1.5">Custom Tags</h4>
          <div className="overflow-x-auto flex no-wrap pb-2 hide-scrollbar" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1.5 w-max">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex-shrink-0 flex items-center rounded-full px-3 py-1 whitespace-nowrap text-white bg-gradient-to-r from-blue-600 to-indigo-800"
                >
                  <span className="text-sm font-medium">{tag}</span>
                  <button type="button" className="ml-1.5 text-xs text-white hover:text-gray-200" onClick={() => removeTag(tag)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag..."
              className="flex-1 border rounded px-2 py-1 text-sm dark:bg-zinc-800 dark:border-gray-700"
            />
            <Button variant="outline" size="sm" className="text-xs" onClick={addTag}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </PopoverContent>
  );
};

export default ApplicationPopover;
