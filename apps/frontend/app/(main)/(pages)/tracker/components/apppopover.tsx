"use client";
import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { PopoverContent } from "@/components/ui/popover";
import { Download, Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Folder } from "@/types/job";
import { ApplicationPopoverProps } from "@/types/trackerComponents";
import { useFolders } from "../hooks/useFolders";

// Function to generate random color
const generateRandomColor = (): string => {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33F5",
    "#F5FF33",
    "#33FFF5",
    "#F533FF",
    "#33F5FF",
    "#FFC233",
    "#33FFC2",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const ApplicationPopover: React.FC<ApplicationPopoverProps> = ({
  job,
  resumeFile,
  coverLetterFile,
  handleResumeUpload,
  handleCoverLetterUpload,
  downloadFile,
  updateTags,
  updateNotes,
  updateFolders,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(job.tags || []);
  const [notes, setNotes] = useState<string>(job.notes || "");
  const [jobFolders, setJobFolders] = useState<Folder[]>(job.folders || []);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Use the folders hook to get all available folders
  const { folders: availableFolders, refreshFolders } = useFolders();

  // Ensure state is updated if job props change
  useEffect(() => {
    setTags(job.tags || []);
    setNotes(job.notes || "");
    setJobFolders(job.folders || []);
  }, [job.tags, job.notes, job.folders]);

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleFolderInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewFolder();
    }
  };

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;

    const newTags = [...tags, trimmed];
    setTags(newTags);
    setTagInput("");

    // Save tags to backend
    if (updateTags) {
      updateTags(job.id, newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);

    // Save tags to backend
    if (updateTags) {
      updateTags(job.id, newTags);
    }
  };

  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
  };

  const saveNotes = () => {
    if (updateNotes && notes !== job.notes) {
      updateNotes(job.id, notes);
    }
  };

  const toggleFolder = (folder: Folder) => {
    // Check if folder is already selected
    const isSelected = jobFolders.some((f) => f.id === folder.id);

    let updatedFolders: Folder[];
    if (isSelected) {
      // Remove folder
      updatedFolders = jobFolders.filter((f) => f.id !== folder.id);
    } else {
      // Add folder
      updatedFolders = [...jobFolders, folder];
    }

    setJobFolders(updatedFolders);

    // Save to backend
    if (updateFolders) {
      updateFolders(job.id, updatedFolders);
    }
  };

  const addNewFolder = () => {
    if (!newFolderName.trim()) return;

    // Create new folder object with randomly generated color
    const newFolder: Folder = {
      id: Date.now(), // Temporary ID until backend assigns a real one
      name: newFolderName.trim(),
      color: generateRandomColor(),
    };

    // Add to selected folders
    const updatedFolders = [...jobFolders, newFolder];
    setJobFolders(updatedFolders);

    // Save to backend
    if (updateFolders) {
      updateFolders(job.id, updatedFolders);
      // Refresh available folders to include the new one
      refreshFolders();
    }

    // Reset inputs
    setNewFolderName("");
    setShowNewFolder(false);
  };

  return (
    <PopoverContent className="p-4 w-80 max-h-[80vh] overflow-y-auto bg-white bg-opacity-100 backdrop-blur-3xl">
      <div className="space-y-3.5">
        {/* Resume section with inline title and buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-bold">Resume</h4>
            <div className="flex items-center gap-1">
              <label className="cursor-pointer inline-flex items-center p-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload
                <input type="file" className="hidden" onChange={handleResumeUpload} />
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-sm"
                disabled={!resumeFile}
                onClick={() => resumeFile && downloadFile(resumeFile)}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </Button>
            </div>
          </div>
          {resumeFile ? (
            <div
              className="mb-2 text-sm truncate bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border dark:border-gray-700"
              title={resumeFile.name}
            >
              {resumeFile.name}
            </div>
          ) : (
            <div className="mb-2 text-sm text-muted-foreground bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border border-dashed dark:border-gray-700">
              No file uploaded
            </div>
          )}
        </div>

        {/* Cover Letter section with inline title and buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-bold">Cover Letter</h4>
            <div className="flex items-center gap-1">
              <label className="cursor-pointer inline-flex items-center p-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload
                <input type="file" className="hidden" onChange={handleCoverLetterUpload} />
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-sm"
                disabled={!coverLetterFile}
                onClick={() => coverLetterFile && downloadFile(coverLetterFile)}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </Button>
            </div>
          </div>
          {coverLetterFile ? (
            <div
              className="mb-2 text-sm truncate bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border dark:border-gray-700"
              title={coverLetterFile.name}
            >
              {coverLetterFile.name}
            </div>
          ) : (
            <div className="mb-2 text-sm text-muted-foreground bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border border-dashed dark:border-gray-700">
              No file uploaded
            </div>
          )}
        </div>

        {/* ATS Score with reduced height */}
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

        {/* Personal Notes with reduced height */}
        <div>
          <h4 className="font-bold mb-1.5">Personal Notes</h4>
          <div className="relative">
            <textarea
              value={notes}
              onChange={handleNotesChange}
              onBlur={saveNotes}
              placeholder="Add personal notes about this job..."
              className="w-full h-16 p-2 border rounded text-sm resize-none dark:bg-zinc-800 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Folders section */}
        <div>
          <h4 className="font-bold mb-1.5">Folders</h4>
          <div className="overflow-x-auto flex no-wrap pb-2 hide-scrollbar" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1.5 w-max">
              {jobFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex-shrink-0 flex items-center rounded-full px-3 py-1 whitespace-nowrap text-white"
                  style={{ backgroundColor: folder.color }}
                >
                  <span className="text-sm font-medium">{folder.name}</span>
                  <button
                    type="button"
                    className="ml-1.5 text-xs text-white hover:text-gray-200"
                    onClick={() => toggleFolder(folder)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {!showNewFolder ? (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-1 text-xs"
                onClick={() => setShowNewFolder(true)}
              >
                <Plus className="h-3.5 w-3.5" /> New Folder
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2 p-2 border rounded dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={handleFolderInputKeyDown}
                  placeholder="Folder name..."
                  className="flex-1 border rounded px-2 py-1 text-sm dark:bg-zinc-800 dark:border-gray-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={addNewFolder}>
                  Add
                </Button>
                <Button variant="ghost" size="sm" className="flex-none" onClick={() => setShowNewFolder(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {availableFolders.length > 0 && (
            <div className="mt-2">
              <h5 className="text-xs font-medium mb-1 text-muted-foreground">Available Folders</h5>
              <div className="overflow-x-auto flex no-wrap hide-scrollbar" style={{ scrollbarWidth: "none" }}>
                <div className="flex gap-1.5 w-max">
                  {availableFolders
                    .filter((f) => !jobFolders.some((sf) => sf.id === f.id))
                    .map((folder) => (
                      <div
                        key={folder.id}
                        className="flex-shrink-0 flex items-center rounded-full px-2.5 py-0.5 cursor-pointer text-xs font-medium text-white"
                        style={{ backgroundColor: folder.color + "99" }}
                        onClick={() => toggleFolder(folder)}
                      >
                        {folder.name}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Tags section */}
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
                    onClick={() => removeTag(tag)}
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
