import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { Trash, Download, Video } from "lucide-react";
import Link from "next/link";

const applications = [
  {
    id: 1,
    company: "Google",
    title: "Software Engineer",
    atsScore: 85,
    status: "complete",
  },
  {
    id: 2,
    company: "Amazon",
    title: "Data Scientist",
    atsScore: 72,
    status: "inprogress",
  },
  {
    id: 3,
    company: "Microsoft",
    title: "Product Manager",
    atsScore: 40,
    status: "queued",
  },
];

// Function to determine ATS score color
const getAtsColor = (score: number) => {
  if (score > 75) return "bg-green-500";
  if (score >= 45) return "bg-yellow-500";
  return "bg-red-500";
};

// Function to render status
const renderStatus = (status: string) => {
  switch (status) {
    case "queued":
      return <span className="text-gray-500">Queued</span>;
    case "inprogress":
      return (
        <Link href="#" className="text-blue-500 underline">
          Watch
        </Link>
      );
    case "complete":
      return <span className="text-green-500">Complete</span>;
    default:
      return <span className="text-gray-500">Unknown</span>;
  }
};

const ApplicationPage = () => {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Applications</span>
      </h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>ATS Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <Image src="/globe.svg" alt={app.company} width={24} height={24} />
                  </Avatar>
                  <div className="w-[200px] truncate">
                    <div className="font-medium">{app.company}</div>
                    <div className="text-xs text-muted-foreground">{app.title}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Progress value={app.atsScore} className={`w-[150px] ${getAtsColor(app.atsScore)}`} />
              </TableCell>
              <TableCell>{renderStatus(app.status)}</TableCell>
              <TableCell className="flex gap-3">
                <Button size="sm" variant="outline" disabled={app.status !== "complete"}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-red-500">
                  <Trash className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={app.status !== "complete"}>
                  <Video className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplicationPage;
