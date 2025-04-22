"use client";
import React, { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import { ApplicationPopoverProps } from "@/types/trackerComponents";
import FileSection from "@/components/ui/filesection";
import { updateJob } from "../services/api";
import { useDebouncedUpdate } from "../hooks/useDebouncedUpdate";

const ApplicationPopover: React.FC<ApplicationPopoverProps> = ({
  job,
  resumeFile,
  coverLetterFile,
  handleResumeUpload,
  handleCoverLetterUpload,
  downloadFile,
  onUpdateJob,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(job.tags ?? []);
  const [notes, setNotes] = useState<string>(job.notes ?? "");

  useEffect(() => {
    setTags(job.tags ?? []);
    setNotes(job.notes ?? "");
  }, [job.tags, job.notes]);

  const debouncedUpdateTags = useDebouncedUpdate((newTags: string[]) => {
    onUpdateJob(job.id, { tags: newTags });
    updateJob(job.id, { tags: newTags }).catch(() => {
      setTags(job.tags ?? []);
      toast.error("Failed to save tags");
    });
  }, 500);

  const debouncedUpdateNotes = useDebouncedUpdate((newNotes: string) => {
    onUpdateJob(job.id, { notes: newNotes });
    updateJob(job.id, { notes: newNotes }).catch(() => {
      setNotes(job.notes ?? "");
      toast.error("Failed to save notes");
    });
  }, 500);

  useEffect(
    () => () => {
      debouncedUpdateTags.flush();
      debouncedUpdateNotes.flush();
    },
    [debouncedUpdateTags, debouncedUpdateNotes],
  );

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
      const newTags = tags.filter((t) => t !== tagToRemove);
      if (newTags.length === tags.length) return;
      setTags(newTags);
      debouncedUpdateTags(newTags);
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
          <h4 className="font-bold mb-1.5">Personal Notes</h4>
          <textarea
            value={notes}
            onChange={(e) => {
              const newNotes = e.target.value;
              setNotes(newNotes);
              debouncedUpdateNotes(newNotes);
            }}
            onBlur={() => {
              debouncedUpdateNotes.flush();
              onUpdateJob(job.id, { notes });
              updateJob(job.id, { notes }).catch(() => {
                setNotes(job.notes ?? "");
                toast.error("Failed to save notes");
              });
            }}
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
                  <button
                    type="button"
                    className="ml-1.5 text-xs text-white hover:text-gray-200"
                    onClick={() => {
                      const newTags = tags.filter((t) => t !== tag);
                      setTags(newTags);
                      debouncedUpdateTags(newTags);
                    }}
                  >
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
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = tagInput.trim();
                  if (trimmed && !tags.includes(trimmed)) {
                    const newTags = [...tags, trimmed];
                    setTags(newTags);
                    setTagInput("");
                    debouncedUpdateTags(newTags);
                  }
                }
              }}
              placeholder="Add a tag..."
              className="flex-1 border rounded px-2 py-1 text-sm dark:bg-zinc-800 dark:border-gray-700"
            />
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                const trimmed = tagInput.trim();
                if (trimmed && !tags.includes(trimmed)) {
                  const newTags = [...tags, trimmed];
                  setTags(newTags);
                  setTagInput("");
                  debouncedUpdateTags(newTags);
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </PopoverContent>
  );
};

export default ApplicationPopover;
