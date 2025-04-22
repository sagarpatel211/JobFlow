"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { TableRow, TableCell } from "@/components/ui/table";
import { Archive, MoreVertical, Star } from "lucide-react";
import { JobRowProps } from "@/types/job";
import { StatusBadge } from "./statusbadge";
import { JobActions } from "./jobactions";
import ApplicationPopover from "./apppopover";
import { updateCompanyFollowers, whitelistCompany, uploadJobAttachment } from "../services/api";
import { createUndoableToast } from "./undotoast";

function ensureProtocol(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function formatPostedDate(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split(".");
  const date = parts.length === 3 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : format(date, "MMM d, yyyy");
}

export function JobRow({
  job,
  updateStatus,
  togglePriority,
  onModifyJob,
  onArchiveJob,
  onDeleteJob,
  onFocus,
  onUpdateJob,
  isBeingProcessed = false,
}: JobRowProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [generateResume, setGenerateResume] = useState(false);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);
  const [isAppPopoverOpen, setIsAppPopoverOpen] = useState(false);
  const [resumeAttachment, setResumeAttachment] = useState<{ name: string; url: string } | null>(
    job.resumeUrl ? { name: job.resumeFilename || "", url: job.resumeUrl } : null,
  );
  const [coverLetterAttachment, setCoverLetterAttachment] = useState<{ name: string; url: string } | null>(
    job.coverLetterUrl ? { name: job.coverLetterFilename || "", url: job.coverLetterUrl } : null,
  );
  const [isFollowersPopoverOpen, setIsFollowersPopoverOpen] = useState(false);
  const [followers, setFollowers] = useState<number>(job.followerCount ?? 0);

  useEffect(() => {
    setFollowers(job.followerCount ?? 0);
  }, [job.followerCount]);

  const decreaseStatus = () => updateStatus(job.id, -1);
  const increaseStatus = () => updateStatus(job.id, 1);
  const handleTogglePriority = () => togglePriority(job.id);

  const handleModify = () => onModifyJob?.(job.id);
  const handleArchive = () => onArchiveJob?.(job.id);
  const handleDelete = () => onDeleteJob?.(job.id);

  const onBlacklistCompany = (company: string) => {
    const message = (
      <>
        Blacklisted <b>{company}</b>
      </>
    );

    const handleUndo = () => {
      toast.success(`Removed ${company} from blacklist`);
    };

    createUndoableToast(message, handleUndo);
  };

  const handleWhitelistCompany = useCallback(async () => {
    await whitelistCompany(job.company);
    toast.success(`Whitelisted ${job.company}`);
  }, [job.company]);

  const handleSetFollowers = useCallback(async () => {
    await updateCompanyFollowers(job.company, followers);
    toast.success(`Updated followers for ${job.company}`);
  }, [job.company, followers]);

  const handleResumeUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const { url, filename } = await uploadJobAttachment(job.id, file, "resume");
        setResumeAttachment({ name: filename, url });
      } catch (error) {
        console.error("Resume upload failed:", error);
        toast.error("Failed to upload resume");
      }
    },
    [job.id],
  );

  useEffect(() => {
    setResumeAttachment(job.resumeUrl ? { name: job.resumeFilename || "", url: job.resumeUrl } : null);
    setCoverLetterAttachment(job.coverLetterUrl ? { name: job.coverLetterFilename || "", url: job.coverLetterUrl } : null);
  }, [job.resumeFilename, job.resumeUrl, job.coverLetterFilename, job.coverLetterUrl]);

  const handleCoverLetterUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const { url, filename } = await uploadJobAttachment(job.id, file, "cover_letter");
        setCoverLetterAttachment({ name: filename, url });
      } catch (error) {
        console.error("Cover letter upload failed:", error);
        toast.error("Failed to upload cover letter");
      }
    },
    [job.id],
  );

  // Download resume via backend proxy
  const handleDownloadResume = () => {
    window.open(`/api/jobs/${String(job.id)}/attachment/resume/download`, "_blank");
  };
  // Download cover letter via backend proxy
  const handleDownloadCoverLetter = () => {
    window.open(`/api/jobs/${String(job.id)}/attachment/cover_letter/download`, "_blank");
  };

  const handleClick = useCallback(() => {
    onFocus?.(job.id);
  }, [job.id, onFocus]);

  return (
    <TableRow className={`hover:bg-muted/50 ${job.priority ? "bg-amber-50 dark:bg-amber-900/20" : ""}`} onClick={handleClick}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2 -mr-[90px]">
          <Avatar className="h-6 w-6">
            {job.company_image_url ? (
              <Image
                src={job.company_image_url}
                alt={job.company}
                width={24}
                height={24}
                className="object-contain"
                onError={(e) => {
                  // Fallback to globe icon if image fails to load
                  e.currentTarget.src = "/globe.svg";
                }}
              />
            ) : (
              <Image src="/globe.svg" alt={job.company} width={24} height={24} />
            )}
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
                          min="0"
                          placeholder="Enter follower count"
                          title="Number of followers"
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
      <TableCell>{typeof job.postedDate === "string" ? formatPostedDate(job.postedDate) : job.postedDate}</TableCell>
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
              className="group relative inline-flex h-8 overflow-hidden rounded-md p-[2px]"
              onClick={(e) => {
                e.preventDefault();
                setIsPopoverOpen(true);
              }}
            >
              <span className="absolute inset-[-1000%] animate-spin bg-[conic-gradient(from_90deg_at_50%_50%,#B0D0FF_0%,#1E3A8A_50%,#B0D0FF_100%)]" />
              <span className="inline-flex h-full w-full items-center justify-center rounded-md bg-slate-100 dark:bg-slate-950 px-3 py-1 text-sm font-medium dark:text-white backdrop-blur-3xl">
                Fill with AI
              </span>
            </Link>
          </PopoverTrigger>
          <PopoverContent className="p-4 w-72 bg-white bg-opacity-80 backdrop-blur-sm">
            <div className="flex flex-col gap-3">
              <Button variant={generateResume ? "secondary" : "outline"} onClick={() => setGenerateResume((p) => !p)}>
                Generate Resume
              </Button>
              <Button variant={generateCoverLetter ? "secondary" : "outline"} onClick={() => setGenerateCoverLetter((p) => !p)}>
                Generate Cover Letter
              </Button>
              <Button onClick={() => void navigator.clipboard.writeText(job.link)}>Submit</Button>
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
            resumeFile={resumeAttachment}
            coverLetterFile={coverLetterAttachment}
            handleResumeUpload={(e) => {
              void handleResumeUpload(e);
            }}
            handleCoverLetterUpload={(e) => {
              void handleCoverLetterUpload(e);
            }}
            downloadFile={(attachment) => {
              if (attachment === resumeAttachment) handleDownloadResume();
              else if (attachment === coverLetterAttachment) handleDownloadCoverLetter();
            }}
            onUpdateJob={onUpdateJob}
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
          disabled={isBeingProcessed}
        />
      </TableCell>
    </TableRow>
  );
}
