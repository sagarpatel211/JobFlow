import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { TableRow, TableCell } from "@/components/ui/table";
import { parse, format, isValid } from "date-fns";
import { JobRowProps } from "@/types/job";
import { StatusBadge } from "./statusbadge";
import { JobActions } from "./jobactions";
import { Archive, MoreVertical, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import toast from "react-hot-toast";

export function JobRow({ job, updateStatus, togglePriority, onModifyJob, onArchiveJob, onDeleteJob }: JobRowProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [generateResume, setGenerateResume] = useState(false);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);

  const decreaseStatus = () => {
    updateStatus(job.id, -1);
  };
  const increaseStatus = () => {
    updateStatus(job.id, 1);
  };
  const onBlacklistCompany = (company: string) => {
    console.log("Blacklist company:", company);
  
    toast((t) => (
      <div className="w-[400px] flex items-center">
        <div className="flex-1 truncate whitespace-nowrap">
          Blacklisted <b>{company}</b>
        </div>
        <Button
          variant="link"
          className="ml-2 text-blue-500 underline shrink-0"
          onClick={() => {
            // Add your undo logic here if needed
            toast.dismiss(t.id);
          }}
        >
          Undo
        </Button>
      </div>
    ), { duration: 5000 });
  };

  const handleSubmitAI = async () => {
    try {
      // Copy job link to clipboard
      await navigator.clipboard.writeText(job.link);
      // Sending additional options with the message
      if (typeof chrome !== "undefined" && "runtime" in chrome && typeof chrome.runtime?.sendMessage === "function") {
        await new Promise<void>((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              message: "EXTRACT_JOB_INFO",
              link: job.link,
              options: { generateResume, generateCoverLetter },
            },
            (response) => {
              if (chrome.runtime.lastError !== undefined && typeof chrome.runtime.lastError.message === "string") {
                console.error("Error sending message:", chrome.runtime.lastError.message);
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                console.log("EXTRACT_JOB_INFO message sent", response);
                resolve();
              }
            },
          );
        });
      } else {
        console.warn("Chrome extension runtime is not available.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in handleSubmitAI:", error.message);
      } else {
        console.error("Unknown error in handleSubmitAI:", error);
      }
    } finally {
      // Close the popover after submission
      setIsPopoverOpen(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
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
                  <DropdownMenuItem
                    onClick={() => {
                      onBlacklistCompany(job.company);
                    }}
                  >
                    Blacklist Company
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell
        title={
          job.postedDate && typeof job.postedDate === "string"
            ? (() => {
              try {
                const parsedDate = parse(job.postedDate);
                return isValid(parsedDate) ? format(parsedDate, "MMM d, yyyy") : "";
              } catch {
                console.error("Invalid date format:", job.postedDate);
                return "";
              }
            })()
            : ""
        }
      >
        {job.postedDate}
      </TableCell>
      <TableCell>
        <div className="max-w-[300px] truncate -mr-[48px]">
          <a href={job.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {job.link}
          </a>
        </div>
      </TableCell>
      <TableCell className="flex items-center gap-40">
        <StatusBadge
          statusIndex={job.statusIndex}
          onDecreaseStatus={decreaseStatus}
          onIncreaseStatus={increaseStatus}
        />
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Link
              href={job.link}
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
          <PopoverContent className="p-4 w-72">
            <div className="flex flex-col gap-3">
              <Button
                variant={generateResume ? "secondary" : "outline"}
                onClick={() => setGenerateResume((prev) => !prev)}
              >
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
      <TableCell className="pr-2">
  <JobActions
    priority={job.priority}
    onTogglePriority={() => {
      togglePriority(job.id);
    }}
    onModify={() => {
      onModifyJob(job.id);
    }}
    onArchive={() => {
      // onArchiveJob(job.id);
      toast((t) => (
        <div className="w-[400px] flex items-center">
          <div className="flex-1 truncate whitespace-nowrap">
            Archived <b>{job.title} @ {job.company}</b>
          </div>
          <Button
            variant="link"
            className="ml-2 text-blue-500 underline shrink-0"
            onClick={() => {
              // onUpdateJob(job.id, { archived: false });
              toast.dismiss(t.id);
            }}
          >
            Undo
          </Button>
        </div>
      ), { duration: 7000 });
    }}
    onDelete={() => {
      // onDeleteJob(job.id);
      toast((t) => (
        <div className="w-[400px] flex items-center">
          <div className="flex-1 truncate whitespace-nowrap">
            Deleted <b>{job.title} @ {job.company}</b>
          </div>
          <Button
            variant="link"
            className="ml-2 text-blue-500 underline shrink-0"
            onClick={() => {
              // onUpdateJob(job.id, { deleted: false });
              toast.dismiss(t.id);
            }}
          >
            Undo
          </Button>
        </div>
      ), { duration: 7000 });
    }}
  />
</TableCell>

    </TableRow>
  );
}
