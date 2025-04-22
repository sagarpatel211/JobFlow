import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, RotateCw } from "lucide-react";

export type DocumentType = "resume" | "cover_letter";

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: "pending" | "completed" | "failed";
  atsScore?: number;
  createdAt: string;
  documents?: {
    type: DocumentType;
    fileName: string;
  }[];
}

interface ApplicationsTableProps {
  applications: Application[];
  expandedRowId?: string | null;
  onToggleRow?: (id: string) => void;
  onViewApplication: (application: Application) => void;
  onDownloadApplication: (application: Application) => void;
  onRegenerateApplication: (application: Application) => void;
  isLoading?: boolean;
  showAtsScore?: boolean;
}

export function ApplicationsTable({
  applications,
  expandedRowId,
  onToggleRow,
  onViewApplication,
  onDownloadApplication,
  onRegenerateApplication,
  isLoading = false,
  showAtsScore = true,
}: ApplicationsTableProps) {
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
    if (!score && score !== 0) return null;

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

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              {showAtsScore && <TableHead>ATS Score</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20" />
                </TableCell>
                {showAtsScore && (
                  <TableCell>
                    <div className="h-4 w-12" />
                  </TableCell>
                )}
                <TableCell>
                  <div className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            {showAtsScore && <TableHead>ATS Score</TableHead>}
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showAtsScore ? 6 : 5} className="text-center py-8 text-muted-foreground">
                No applications generated yet
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <React.Fragment key={app.id}>
                <TableRow
                  className={expandedRowId === app.id ? "bg-muted/50" : ""}
                  onClick={() => onToggleRow && onToggleRow(app.id)}
                  style={{ cursor: onToggleRow ? "pointer" : "default" }}
                >
                  <TableCell className="font-medium">{app.jobTitle}</TableCell>
                  <TableCell>{app.company}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  {showAtsScore && <TableCell>{getATSScoreBadge(app.atsScore)}</TableCell>}
                  <TableCell>{formatDate(app.createdAt)}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewApplication(app);
                      }}
                      disabled={app.status !== "completed"}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadApplication(app);
                      }}
                      disabled={app.status !== "completed"}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegenerateApplication(app);
                      }}
                      disabled={app.status === "pending"}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
