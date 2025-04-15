import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DocumentPreviewProps {
  resume: string;
  coverLetter: string;
  onDownload: (documentType: "resume" | "coverLetter") => void;
}

export function DocumentPreview({ resume, coverLetter, onDownload }: DocumentPreviewProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Document Preview</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onDownload("resume")} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download Resume
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownload("coverLetter")} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download Cover Letter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
          </TabsList>
          <TabsContent value="resume">
            <div className="border rounded-md p-4 mt-4 min-h-[500px] whitespace-pre-wrap bg-white">
              {resume || <div className="text-muted-foreground text-center py-8">No resume generated yet</div>}
            </div>
          </TabsContent>
          <TabsContent value="coverLetter">
            <div className="border rounded-md p-4 mt-4 min-h-[500px] whitespace-pre-wrap bg-white">
              {coverLetter || <div className="text-muted-foreground text-center py-8">No cover letter generated yet</div>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
