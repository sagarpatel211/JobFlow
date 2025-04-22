"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Edit, Save, Eye, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default), { ssr: false });

export interface DocumentPreviewProps {
  title: string;
  content: string;
  contentType?: string;
  htmlContent?: string;
  fileName: string;
  onFileNameChange: (fileName: string) => void;
  isEditingFileName: boolean;
  onEditFileName: () => void;
  onSaveFileName: () => void;
  onDownload: () => void;
  onContentChange?: (newContent: string) => void;
  applicationId?: string;
  documentType?: string;
  readonly?: boolean;
}

export function DocumentPreview({
  title,
  content,
  contentType,
  htmlContent,
  fileName,
  onFileNameChange,
  isEditingFileName,
  onEditFileName,
  onSaveFileName,
  onDownload,
  onContentChange,
  applicationId,
  documentType,
  readonly = false,
}: DocumentPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "pdf">("preview");
  const [iframeKey, setIframeKey] = useState(Date.now());

  const toggleEditMode = () => {
    if (isEditing) {
      onContentChange?.(editedContent);
      setIsEditing(false);
    } else {
      setEditedContent(content);
      setIsEditing(true);
      setViewMode("edit");
    }
  };

  const getPdfUrl = () => {
    if (!applicationId || !documentType) return "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    return `${apiUrl}/api/applications/${applicationId}/documents/${documentType}?format=pdf`;
  };

  const changeView = (value: string) => {
    const mode = value as "edit" | "preview" | "pdf";
    if (mode === "pdf") setIframeKey(Date.now());
    setViewMode(mode);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex space-x-2">
          {!readonly && (
            <Button variant="outline" size="sm" onClick={toggleEditMode} className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" /> Save
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" /> Edit
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDownload} className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filename:</span>
            {isEditingFileName ? (
              <div className="flex items-center gap-2">
                <Input value={fileName} onChange={(e) => onFileNameChange(e.target.value)} className="h-8 w-48" />
                <Button size="sm" variant="ghost" onClick={onSaveFileName}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">{fileName}</span>
                {!readonly && (
                  <Button size="sm" variant="ghost" onClick={onEditFileName}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <Tabs value={viewMode} onValueChange={changeView} className="w-auto">
            <TabsList className="grid w-[240px] grid-cols-3">
              {isEditing && (
                <TabsTrigger value="edit" className="flex items-center gap-1">
                  <Edit className="h-3 w-3" /> Edit
                </TabsTrigger>
              )}
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> Preview
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex items-center gap-1">
                <FileDown className="h-3 w-3" /> PDF
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Tabs value={viewMode} className="w-full">
            {isEditing && (
              <TabsContent value="edit" className="m-0">
                <div data-color-mode="light" className="min-h-[500px]">
                  <MDEditor
                    value={editedContent}
                    onChange={(v) => v !== undefined && setEditedContent(v)}
                    height={500}
                    preview="edit"
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent value="preview" className="m-0 p-4">
              <div className="prose max-w-none dark:prose-invert min-h-[500px] whitespace-pre-wrap overflow-auto">
                {content ? (
                  <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                    {isEditing ? editedContent : content}
                  </ReactMarkdown>
                ) : (
                  <div className="text-muted-foreground text-center py-8">No {title.toLowerCase()} generated yet</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pdf" className="m-0 p-0 min-h-[500px]">
              {applicationId && documentType ? (
                <iframe key={iframeKey} src={getPdfUrl()} className="w-full h-full border-0" title={`${title} PDF Preview`} />
              ) : (
                <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                  PDF preview not available. Please save the document first.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
