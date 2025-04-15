"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { TableRow, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { JobRowProps } from "@/types/job";
import { StatusBadge } from "./statusbadge";
import { Archive, MoreVertical, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import toast from "react-hot-toast";
import { JobActions } from "./jobactions";
import ApplicationPopover from "./apppopover";
import { updateJob, whitelistCompany, updateCompanyFollowers } from "../services/api";

function ensureProtocol(url: string): string {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    let date: Date;
    if (dateStr.includes(".")) {
      const [day, month, year] = dateStr.split(".").map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateStr);
    }
    return isNaN(date.getTime()) ? dateStr : format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function JobRow({ job, updateStatus, togglePriority, onModifyJob, onArchiveJob, onDeleteJob, onFocus }: JobRowProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [generateResume, setGenerateResume] = useState(false);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);
  const [isAppPopoverOpen, setIsAppPopoverOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [isFollowersPopoverOpen, setIsFollowersPopoverOpen] = useState(false);
  const [followers, setFollowers] = useState<number>(job.followerCount || 0);

  useEffect(() => {
    setFollowers(job.followerCount || 0);
  }, [job.followerCount]);

  const decreaseStatus = () => {
    updateStatus(job.id, -1);
  };

  const increaseStatus = () => {
    updateStatus(job.id, 1);
  };

  const handleTogglePriority = () => {
    togglePriority(job.id);
  };

  const handleModify = () => {
    if (onModifyJob) onModifyJob(job.id);
  };

  const handleArchive = () => {
    if (onArchiveJob) {
      onArchiveJob(job.id);
    } else {
      toast.success(`Archived ${job.title} @ ${job.company}`);
    }
  };

  const handleDelete = () => {
    if (onDeleteJob) {
      onDeleteJob(job.id);
    } else {
      toast.success(`Deleted ${job.title} @ ${job.company}`);
    }
  };

  const handleUpdateTags = (jobId: number, tags: string[]) => {
    try {
      void updateJob(jobId, { tags });
    } catch (error) {
      console.error("Error updating tags:", error);
      toast.error("Failed to update tags");
    }
  };

  const handleUpdateNotes = (jobId: number, notes: string) => {
    try {
      if (notes !== job.notes) {
        void updateJob(jobId, { notes });
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const onBlacklistCompany = (company: string) => {
    toast(
      (t) => (
        <div className="w-[400px] flex items-center">
          <div className="flex-1 truncate whitespace-nowrap">
            Blacklisted <b>{company}</b>
          </div>
          <Button variant="link" className="ml-2 text-blue-500 underline shrink-0" onClick={() => toast.dismiss(t.id)}>
            Undo
          </Button>
        </div>
      ),
      { duration: 5000 },
    );
    window.location.reload();
  };

  const handleWhitelistCompany = useCallback(async () => {
    try {
      await whitelistCompany(job.company);
      toast.success(`Whitelisted ${job.company}`);
      window.location.reload();
    } catch (error) {
      console.error("Error whitelisting company:", error);
      toast.error("Failed to whitelist company");
    }
  }, [job.company]);

  const handleSetFollowers = useCallback(async () => {
    try {
      await updateCompanyFollowers(job.company, followers);
      toast.success(`Updated followers for ${job.company}`);
      window.location.reload();
    } catch (error) {
      console.error("Error updating followers:", error);
      toast.error("Failed to update follower count");
    }
  }, [job.company, followers]);

  const handleSubmitAI = () => {
    navigator.clipboard
      .writeText(job.link)
      .then(() => {
        if (typeof chrome !== "undefined" && "runtime" in chrome && typeof chrome.runtime?.sendMessage === "function") {
          return new Promise<void>((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                message: "EXTRACT_JOB_INFO",
                link: job.link,
                options: { generateResume, generateCoverLetter },
              },
              (response) => {
                if (chrome.runtime.lastError !== undefined && typeof chrome.runtime.lastError.message === "string") {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              },
            );
          });
        }
        return Promise.resolve();
      })
      .catch((error: unknown) => {
        console.error("Error in handleSubmitAI:", error);
      })
      .finally(() => {
        setIsPopoverOpen(false);
      });
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleCoverLetterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverLetterFile(e.target.files[0]);
    }
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClick = useCallback(() => {
    if (onFocus) {
      onFocus(job.id);
    }
  }, [job.id, onFocus]);

  return (
    <TableRow className={`hover:bg-muted/50 ${job.priority ? "bg-amber-50 dark:bg-amber-900/20" : ""}`} onClick={handleClick}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2 -mr-[90px]">
          <Avatar className="h-6 w-6">
            <Image src="/globe.svg" alt={job.company} width={24} height={24} />
          </Avatar>
          <div className="flex items-center gap-2">
            <div className="w-[200px]">
              <div className="flex items-center truncate">
                {job.company}
                {job.priority && <Star className="ml-1 h-4 w-4 text-amber-500" />}
                {job.archived && <Archive className="ml-1 h-4 w-4 text-gray-500" />}
              </div>
              <div className="text-xs text-muted-foreground truncate">{job.title}</div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={-14}>
                  <DropdownMenuItem onClick={() => onBlacklistCompany(job.company)}>Blacklist Company</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleWhitelistCompany()}>Whitelist Company</DropdownMenuItem>
                  <Popover open={isFollowersPopoverOpen} onOpenChange={setIsFollowersPopoverOpen}>
                    <PopoverTrigger asChild>
                      <DropdownMenuItem onClick={() => setIsFollowersPopoverOpen(true)}>
                        Set Followers {job.followerCount ? `(${String(job.followerCount)})` : ""}
                      </DropdownMenuItem>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 w-64">
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          value={followers}
                          onChange={(e) => setFollowers(Number(e.target.value))}
                          placeholder="Enter follower count"
                          min="0"
                          className="border rounded px-2 py-1"
                        />
                        <Button variant="default" onClick={() => void handleSetFollowers()}>
                          Confirm
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {job.postedDate && typeof job.postedDate === "string" ? formatPostedDate(job.postedDate) : job.postedDate}
      </TableCell>
      <TableCell>
        <div className="max-w-[300px] truncate -mr-[48px]">
          <a href={ensureProtocol(job.link)} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {job.link}
          </a>
        </div>
      </TableCell>
      <TableCell className="flex items-center gap-40 -mr-[80px]">
        <StatusBadge statusIndex={job.statusIndex} onDecreaseStatus={decreaseStatus} onIncreaseStatus={increaseStatus} />
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Link
              href={ensureProtocol(job.link)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex h-8 overflow-hidden rounded-md p-[2px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              onClick={(e) => {
                e.preventDefault();
                setIsPopoverOpen(true);
              }}
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] group-hover:animate-[spin_2s_linear_reverse_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#B0D0FF_0%,#1E3A8A_50%,#B0D0FF_100%)] group-hover:bg-[conic-gradient(from_90deg_at_50%_50%,#A0C4FF_0%,#162D70_50%,#A0C4FF_100%)] transition-[background] duration-3000 ease-in-out" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-md bg-slate-100 dark:bg-slate-950 px-3 py-1 text-sm font-medium dark:text-white backdrop-blur-3xl">
                Fill with AI
              </span>
            </Link>
          </PopoverTrigger>
          <PopoverContent className="p-4 w-72 bg-white bg-opacity-80 backdrop-blur-sm">
            <div className="flex flex-col gap-3">
              <Button variant={generateResume ? "secondary" : "outline"} onClick={() => setGenerateResume((prev) => !prev)}>
                Generate Resume
              </Button>
              <Button
                variant={generateCoverLetter ? "secondary" : "outline"}
                onClick={() => setGenerateCoverLetter((prev) => !prev)}
              >
                Generate Cover Letter
              </Button>
              <Button onClick={handleSubmitAI}>Submit</Button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell>
        <Popover open={isAppPopoverOpen} onOpenChange={setIsAppPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost">View</Button>
          </PopoverTrigger>
          <ApplicationPopover
            job={job}
            resumeFile={resumeFile}
            coverLetterFile={coverLetterFile}
            handleResumeUpload={handleResumeUpload}
            handleCoverLetterUpload={handleCoverLetterUpload}
            downloadFile={downloadFile}
            updateTags={handleUpdateTags}
            updateNotes={handleUpdateNotes}
          />
        </Popover>
      </TableCell>
      <TableCell className="pr-2">
        <JobActions
          priority={job.priority}
          archived={job.archived}
          onTogglePriority={handleTogglePriority}
          onModify={handleModify}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      </TableCell>
    </TableRow>
  );
}
