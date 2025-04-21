import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Edit, Save, Eye, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default), { ssr: false });

// Dynamically import Markdown component
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
const rehypeRaw = dynamic(() => import("rehype-raw"), { ssr: false });
const remarkGfm = dynamic(() => import("remark-gfm"), { ssr: false });

interface DocumentPreviewProps {
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
  contentType = "text/markdown",
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
  const [iframeKey, setIframeKey] = useState(Date.now()); // Force iframe refresh

  // Save edited content
  const handleSaveContent = () => {
    if (onContentChange) {
      onContentChange(editedContent);
    }
    setIsEditing(false);
  };

  // Handle content change in the editor
  const handleContentChange = (value?: string) => {
    if (value !== undefined) {
      setEditedContent(value);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      handleSaveContent();
    } else {
      setEditedContent(content);
      setIsEditing(true);
      setViewMode("edit");
    }
  };

  // Generate PDF URL
  const getPdfUrl = () => {
    if (!applicationId || !documentType) return "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${apiUrl}/api/applications/${applicationId}/documents/${documentType}?format=pdf`;
  };

  // Generate HTML URL
  const getHtmlUrl = () => {
    if (!applicationId || !documentType) return "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${apiUrl}/api/applications/${applicationId}/documents/${documentType}?format=html`;
  };

  // Refresh the iframe when switching to PDF view to ensure latest content
  const handleViewModeChange = (value: string) => {
    if (value === "pdf") {
      setIframeKey(Date.now());
    }
    setViewMode(value as "edit" | "preview" | "pdf");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex space-x-2">
          {!readonly && (
            <Button variant="outline" size="sm" onClick={toggleEditMode} className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDownload} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download
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

          <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-auto">
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
                  <MDEditor value={editedContent} onChange={handleContentChange} height={500} preview="edit" />
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
                <div className="w-full h-[600px]">
                  <iframe key={iframeKey} src={getPdfUrl()} className="w-full h-full border-0" title={`${title} PDF Preview`} />
                </div>
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
