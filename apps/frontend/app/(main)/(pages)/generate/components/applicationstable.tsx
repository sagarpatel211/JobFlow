import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, RotateCw } from "lucide-react";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: "pending" | "completed" | "failed";
  atsScore?: number;
  createdAt: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  onView: (application: Application) => void;
  onDownload: (application: Application) => void;
  onRegenerate: (application: Application) => void;
}

export function ApplicationsTable({ applications, onView, onDownload, onRegenerate }: ApplicationsTableProps) {
  const getStatusBadge = (status: Application["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  const getATSScoreBadge = (score?: number) => {
    if (!score) return null;

    let variant: "outline" | "success" | "warning" | "destructive" = "outline";
    if (score >= 80) variant = "success";
    else if (score >= 60) variant = "warning";
    else variant = "destructive";

    return <Badge variant={variant}>{score}%</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ATS Score</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No applications generated yet
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.jobTitle}</TableCell>
                <TableCell>{app.company}</TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell>{getATSScoreBadge(app.atsScore)}</TableCell>
                <TableCell>{formatDate(app.createdAt)}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onView(app)} disabled={app.status !== "completed"}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDownload(app)} disabled={app.status !== "completed"}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onRegenerate(app)} disabled={app.status === "pending"}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
