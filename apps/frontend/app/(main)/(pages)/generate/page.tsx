"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "react-hot-toast";
import { Search } from "lucide-react";
import { JobApplicationForm } from "./components/jobappform";
import { DocumentPreview } from "./components/documentpreview";
import { ApplicationsTable } from "./components/applicationstable";
import { PaginationControls } from "./components/paginationcontrols";
import { HotkeysDialog } from "./components/hotkeysdialog";
import { Application, DocumentType } from "./components/applicationstable";
import { generateCoverLetter } from "../tracker/services/api";

interface FormValues {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumeData?: string;
  includeResumeData: boolean;
  includeCoverLetter: boolean;
}

interface DocumentContent {
  type: DocumentType;
  fileName: string;
  content: string;
  contentType?: string;
  rawContent?: string;
  htmlContent?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ITEMS_PER_PAGE = 3;

export default function GeneratePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Form & generation
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentType[]>(["resume", "cover_letter"]);

  // Application list & search
  const [generatedApplications, setGeneratedApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Document preview/edit/download
  const [showDocumentPreviews, setShowDocumentPreviews] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("resume.pdf");
  const [coverLetterFileName, setCoverLetterFileName] = useState("cover_letter.pdf");
  const [isEditingResumeFileName, setIsEditingResumeFileName] = useState(false);
  const [isEditingCoverLetterFileName, setIsEditingCoverLetterFileName] = useState(false);
  const [currentDocumentContent, setCurrentDocumentContent] = useState<DocumentContent | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // --- New State for Cover Letter Generation ---
  const [generateJobId, setGenerateJobId] = useState<string>("");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [generatedCoverLetterUrl, setGeneratedCoverLetterUrl] = useState<string | null>(null);
  const [generatedCoverLetterFilename, setGeneratedCoverLetterFilename] = useState<string | null>(null);
  // ---------------------------------------------

  // Initial fetch
  useEffect(() => {
    void fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const resp = await fetch(`${API_URL}/api/applications`);
      const data = (await resp.json()) as { success: boolean; applications: Application[] };
      if (data.success) {
        setGeneratedApplications(data.applications);
      } else {
        toast.error("Failed to fetch applications");
      }
    } catch {
      toast.error("Failed to fetch applications");
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const toggleDocumentSelection = useCallback((docType: DocumentType) => {
    setSelectedDocuments((prev) => (prev.includes(docType) ? prev.filter((d) => d !== docType) : [...prev, docType]));
  }, []);

  const handleRowToggle = useCallback((id: string) => {
    setExpandedRowId((prev) => (prev === id ? (setShowDocumentPreviews(false), setCurrentDocumentContent(null), null) : id));
  }, []);

  const filteredApps = generatedApplications.filter(
    (app) =>
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
  const pageItems = filteredApps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFormSubmit = async (values: FormValues) => {
    const tempId = "temp-" + Date.now().toString();
    const optimistic: Application = {
      id: tempId,
      company: values.company,
      jobTitle: values.jobTitle,
      status: "pending",
      createdAt: new Date().toISOString(),
      documents: [],
    };
    if (values.includeResumeData) optimistic.documents?.push({ type: "resume", fileName: "resume.pdf" });
    if (values.includeCoverLetter) optimistic.documents?.push({ type: "cover_letter", fileName: "cover_letter.pdf" });

    setGeneratedApplications([optimistic, ...generatedApplications]);
    setIsGeneratingDocs(true);

    try {
      const resp = await fetch(`${API_URL}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await resp.json()) as { success: boolean; application: Application };
      if (data.success) {
        setGeneratedApplications((prev) => [data.application, ...prev.filter((a) => a.id !== tempId)]);
        setExpandedRowId(data.application.id);
        if (data.application.documents?.length) {
          await fetchDocumentContent(data.application.documents[0].type, data.application.id);
        }
        toast.success("Application generated!");
      } else {
        setGeneratedApplications((prev) => prev.filter((a) => a.id !== tempId));
        toast.error("Generation failed");
      }
    } catch {
      setGeneratedApplications((prev) => prev.filter((a) => a.id !== tempId));
      toast.error("Generation failed");
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const fetchDocumentContent = async (type: DocumentType, appId: string) => {
    try {
      const resp = await fetch(`${API_URL}/api/applications/${appId}/documents/${type}`);
      const json = (await resp.json()) as { success: boolean; document: DocumentContent };
      if (json.success) {
        setCurrentDocumentContent(json.document);
        setShowDocumentPreviews(true);
      } else {
        toast.error(`Failed to load ${type}`);
      }
    } catch {
      toast.error(`Failed to load ${type}`);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!expandedRowId || !currentDocumentContent) return;
    void (async () => {
      try {
        const resp = await fetch(`${API_URL}/api/applications/${expandedRowId}/documents/${currentDocumentContent.type}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        });
        const json = (await resp.json()) as { success: boolean; document: DocumentContent };
        if (json.success) {
          setCurrentDocumentContent(json.document);
          toast.success("Document updated");
        } else {
          toast.error("Update failed");
        }
      } catch {
        toast.error("Update failed");
      }
    })();
  };

  function handleDownload(documentType: DocumentType, applicationId: string) {
    const pdfUrl = `${API_URL}/api/applications/${applicationId}/documents/${documentType}?format=pdf`;
    window.open(pdfUrl, "_blank");
    toast.success(`Downloading ${documentType}`);
  }

  const switchDocument = (docType: DocumentType) => {
    if (expandedRowId && currentDocumentContent?.type !== docType) {
      void fetchDocumentContent(docType, expandedRowId);
    }
  };

  const viewApplication = (app: Application) => {
    void (async () => {
      try {
        const resp = await fetch(`${API_URL}/api/applications/${app.id}`);
        const json = (await resp.json()) as { success: boolean; application: Application };
        if (json.success) {
          setExpandedRowId(app.id);
          if (json.application.documents?.length) {
            await fetchDocumentContent(json.application.documents[0].type, app.id);
          }
        } else {
          toast.error("Failed to load details");
        }
      } catch {
        toast.error("Failed to load details");
      }
    })();
  };

  // --- New Function to Handle Cover Letter Generation ---
  const handleGenerateCoverLetter = async () => {
    const jobId = parseInt(generateJobId, 10);
    if (isNaN(jobId) || jobId <= 0) {
      toast.error("Please enter a valid Job ID.");
      return;
    }
    setIsGeneratingCoverLetter(true);
    setGeneratedCoverLetterUrl(null);
    setGeneratedCoverLetterFilename(null);
    try {
      const result = await generateCoverLetter(jobId);
      if (result.success && result.coverLetterUrl) {
        toast.success(result.message || "Cover letter generated!");
        setGeneratedCoverLetterUrl(result.coverLetterUrl);
        setGeneratedCoverLetterFilename(result.coverLetterFilename || "cover_letter.txt");
        // TODO: Optionally update the main job list state if this page were managing it
      } else {
        toast.error(result.error || "Failed to generate cover letter.");
      }
    } catch (err) {
      toast.error("An error occurred during generation.");
      console.error(err);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  return (
    <div className="container pb-8">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="my-6 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-3">Generate Cover Letter for Job</h2>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Enter Job ID from Tracker"
            value={generateJobId}
            onChange={(e) => setGenerateJobId(e.target.value)}
            className="max-w-xs"
          />
          <Button
            onClick={() => {
              void handleGenerateCoverLetter();
            }}
            disabled={isGeneratingCoverLetter || !generateJobId}
          >
            {isGeneratingCoverLetter ? "Generating..." : "Generate"}
          </Button>
        </div>
        {generatedCoverLetterUrl && (
          <div className="mt-3">
            <p>Generated Cover Letter:</p>
            <a href={generatedCoverLetterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {generatedCoverLetterFilename}
            </a>
          </div>
        )}
      </div>

      <div className="my-4 flex flex-col gap-2">
        <Tabs defaultValue="new">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="new">New Application</TabsTrigger>
              <TabsTrigger value="applications">My Applications</TabsTrigger>
            </TabsList>
            <HotkeysDialog />
          </div>

          <TabsContent value="new" className="space-y-4">
            <JobApplicationForm
              onSubmit={(vals) => {
                void handleFormSubmit(vals);
              }}
              isSubmitting={isGeneratingDocs}
              onToggleDocument={(d) => toggleDocumentSelection(d as DocumentType)}
              selectedDocuments={selectedDocuments}
            />

            {showDocumentPreviews && currentDocumentContent && expandedRowId && (
              <div className="mt-8">
                <Tabs defaultValue={currentDocumentContent.type} onValueChange={(v) => switchDocument(v as DocumentType)}>
                  <TabsList>
                    {generatedApplications
                      .find((a) => a.id === expandedRowId)
                      ?.documents?.map((d) => (
                        <TabsTrigger key={d.type} value={d.type}>
                          {d.type === "resume" ? "Resume" : "Cover Letter"}
                        </TabsTrigger>
                      ))}
                  </TabsList>
                </Tabs>

                <DocumentPreview
                  title={currentDocumentContent.type === "resume" ? "Resume" : "Cover Letter"}
                  content={currentDocumentContent.content}
                  contentType={currentDocumentContent.contentType}
                  htmlContent={currentDocumentContent.htmlContent}
                  fileName={currentDocumentContent.fileName}
                  applicationId={expandedRowId}
                  documentType={currentDocumentContent.type}
                  onFileNameChange={currentDocumentContent.type === "resume" ? setResumeFileName : setCoverLetterFileName}
                  isEditingFileName={
                    currentDocumentContent.type === "resume" ? isEditingResumeFileName : isEditingCoverLetterFileName
                  }
                  onEditFileName={() =>
                    currentDocumentContent.type === "resume"
                      ? setIsEditingResumeFileName(true)
                      : setIsEditingCoverLetterFileName(true)
                  }
                  onSaveFileName={() =>
                    currentDocumentContent.type === "resume"
                      ? setIsEditingResumeFileName(false)
                      : setIsEditingCoverLetterFileName(false)
                  }
                  onDownload={() => {
                    if (expandedRowId && currentDocumentContent) {
                      handleDownload(currentDocumentContent.type, expandedRowId);
                    }
                  }}
                  onContentChange={(c) => handleContentChange(c)}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                id="application-search"
                placeholder="Search applications..."
                className="flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ApplicationsTable
              applications={pageItems}
              expandedRowId={expandedRowId}
              onToggleRow={handleRowToggle}
              onViewApplication={viewApplication}
              onDownloadApplication={(app) => {
                if (app.documents) {
                  app.documents.forEach((d) => handleDownload(d.type, app.id));
                }
              }}
              onRegenerateApplication={() => toast("Regenerate not implemented")}
              isLoading={isLoadingApplications}
              showAtsScore
            />

            {filteredApps.length > 0 && (
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
