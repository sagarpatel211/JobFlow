"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "react-hot-toast";
import { Search } from "lucide-react";
import { JobApplicationForm } from "./components/jobappform";
import { DocumentPreview } from "./components/documentpreview";
import { ATSScoreAnalysis } from "./components/atsanalysis";
import { ApplicationsTable } from "./components/applicationstable";
import { PaginationControls } from "./components/paginationcontrols";
import { HotkeysDialog } from "./components/hotkeysdialog";

// Define the form values interface
interface FormValues {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumeData?: string;
  includeResumeData: boolean;
  includeCoverLetter: boolean;
}

// Define Application interface to match ApplicationsTable
interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: "pending" | "completed" | "failed";
  atsScore?: number;
  createdAt: string;
  documents?: {
    type: string;
    fileName: string;
  }[];
}

interface DocumentContent {
  type: string;
  fileName: string;
  content: string;
  contentType?: string;
  rawContent?: string;
  htmlContent?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GeneratePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Q&A Section
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

  // Application Generation Section
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(["resume", "cover_letter"]);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsStrengths, setAtsStrengths] = useState<string[]>([]);
  const [atsWeaknesses, setAtsWeaknesses] = useState<string[]>([]);

  // Document preview states
  const [showDocumentPreviews, setShowDocumentPreviews] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("resume.pdf");
  const [coverLetterFileName, setCoverLetterFileName] = useState("cover_letter.pdf");
  const [isEditingResumeFileName, setIsEditingResumeFileName] = useState(false);
  const [isEditingCoverLetterFileName, setIsEditingCoverLetterFileName] = useState(false);
  const [currentDocumentContent, setCurrentDocumentContent] = useState<DocumentContent | null>(null);
  const [activeDocumentType, setActiveDocumentType] = useState<string | null>(null);

  // Generated Applications List
  const [generatedApplications, setGeneratedApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("new");

  // Pagination
  const ITEMS_PER_PAGE = 3;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch applications on component mount
  useEffect(() => {
    void fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const response = await fetch(`${API_URL}/api/applications`);
      const data = (await response.json()) as { success: boolean; applications: Application[] };
      if (data.success) {
        setGeneratedApplications(data.applications);
      } else {
        toast.error("Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to fetch applications");
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Toggle document selection
  const toggleDocumentSelection = useCallback((docType: string) => {
    setSelectedDocuments((prev) => (prev.includes(docType) ? prev.filter((doc) => doc !== docType) : [...prev, docType]));
  }, []);

  // Handle row expansion
  const handleRowToggle = useCallback((id: string) => {
    setExpandedRowId((prev) => {
      // If we're closing the current row, clear document content
      if (prev === id) {
        setCurrentDocumentContent(null);
        setShowDocumentPreviews(false);
        setActiveDocumentType(null);
        return null;
      }
      return id;
    });
  }, []);

  // Filter generated applications based on search term
  const filteredApplications = generatedApplications.filter(
    (app) =>
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Handlers for the new components
  const handleFormSubmit = async (values: FormValues) => {
    // Optimistic update
    const optimisticApplication: Application = {
      id: `temp-${Date.now().toString()}`,
      company: values.company,
      jobTitle: values.jobTitle,
      status: "pending",
      createdAt: new Date().toISOString(),
      documents: [],
    };

    if (values.includeResumeData) {
      optimisticApplication.documents?.push({ type: "resume", fileName: "resume.pdf" });
    }
    if (values.includeCoverLetter) {
      optimisticApplication.documents?.push({ type: "cover_letter", fileName: "cover_letter.pdf" });
    }

    setGeneratedApplications([optimisticApplication, ...generatedApplications]);
    setIsGeneratingDocs(true);

    try {
      const response = await fetch(`${API_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: values.company,
          jobTitle: values.jobTitle,
          jobDescription: values.jobDescription,
          includeResumeData: values.includeResumeData,
          includeCoverLetter: values.includeCoverLetter,
        }),
      });

      const data = (await response.json()) as { success: boolean; application: Application };

      if (data.success) {
        // Replace the optimistic entry with the real one
        setGeneratedApplications((prev) => [data.application, ...prev.filter((app) => app.id !== optimisticApplication.id)]);
        setCompany(values.company);
        setJobTitle(values.jobTitle);
        setJobDescription(values.jobDescription);

        // Set the expanded row to the new application
        setExpandedRowId(data.application.id);

        // If documents were generated, fetch the first one
        if (data.application.documents && data.application.documents.length > 0) {
          const firstDoc = data.application.documents[0];
          await fetchDocumentContent(firstDoc.type, data.application.id);
          setActiveDocumentType(firstDoc.type);
        }

        toast.success("Application generated successfully!");
      } else {
        // Remove the optimistic entry
        setGeneratedApplications((prev) => prev.filter((app) => app.id !== optimisticApplication.id));
        toast.error("Failed to generate application");
      }
    } catch (error) {
      console.error("Error generating application:", error);
      setGeneratedApplications((prev) => prev.filter((app) => app.id !== optimisticApplication.id));
      toast.error("Failed to generate application");
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const fetchDocumentContent = async (documentType: string, applicationId: string) => {
    if (!applicationId) return;

    try {
      const response = await fetch(`${API_URL}/api/applications/${applicationId}/documents/${documentType}`);
      const data = (await response.json()) as { success: boolean; document: DocumentContent };

      if (data.success) {
        setCurrentDocumentContent(data.document);
        setShowDocumentPreviews(true);

        // Update filename state based on document type
        if (documentType === "resume") {
          setResumeFileName(data.document.fileName);
        } else if (documentType === "cover_letter") {
          setCoverLetterFileName(data.document.fileName);
        }
      } else {
        toast.error(`Failed to fetch ${documentType}`);
      }
    } catch (error) {
      console.error(`Error fetching ${documentType}:`, error);
      toast.error(`Failed to fetch ${documentType}`);
    }
  };

  const handleContentChange = async (newContent: string) => {
    if (!expandedRowId || !currentDocumentContent) return;

    const docType = currentDocumentContent.type;

    try {
      const response = await fetch(`${API_URL}/api/applications/${expandedRowId}/documents/${docType}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newContent,
        }),
      });

      const data = (await response.json()) as { success: boolean; document: DocumentContent };

      if (data.success) {
        setCurrentDocumentContent(data.document);
        toast.success(`${docType === "resume" ? "Resume" : "Cover letter"} updated successfully`);
      } else {
        toast.error(`Failed to update ${docType}`);
      }
    } catch (error) {
      console.error(`Error updating ${docType}:`, error);
      toast.error(`Failed to update ${docType}`);
    }
  };

  const handleDownload = async (documentType: "resume" | "coverLetter", applicationId: string) => {
    if (!applicationId) return;

    // For PDF direct download
    const apiDocType = documentType === "resume" ? "resume" : "cover_letter";
    const pdfUrl = `${API_URL}/api/applications/${applicationId}/documents/${apiDocType}?format=pdf`;

    // Open in a new tab for download
    window.open(pdfUrl, "_blank");
    toast.success(`Downloading ${documentType === "resume" ? "resume" : "cover letter"}`);
  };

  const handleSwitchDocument = async (docType: string) => {
    if (!expandedRowId) return;

    if (docType !== activeDocumentType) {
      await fetchDocumentContent(docType, expandedRowId);
      setActiveDocumentType(docType);
    }
  };

  const handleViewApplication = async (application: Application) => {
    try {
      const response = await fetch(`${API_URL}/api/applications/${application.id}`);
      const data = (await response.json()) as { success: boolean; application: Application };

      if (data.success) {
        // Set the application details for viewing
        setExpandedRowId(application.id);

        // If the application has documents, fetch the first one
        if (application.documents && application.documents.length > 0) {
          const firstDoc = application.documents[0];
          await fetchDocumentContent(firstDoc.type, application.id);
          setActiveDocumentType(firstDoc.type);
        }
      } else {
        toast.error("Failed to fetch application details");
      }
    } catch (error) {
      console.error("Error fetching application details:", error);
      toast.error("Failed to fetch application details");
    }
  };

  const handleDownloadApplication = (application: Application) => {
    if (application.documents && application.documents.length > 0) {
      // Download all documents one by one
      application.documents.forEach((doc) => {
        const docType = doc.type === "resume" ? "resume" : "coverLetter";
        void handleDownload(docType as "resume" | "coverLetter", application.id);
      });
    } else {
      toast.error("No documents available to download");
    }
  };

  // This would be implemented in a real application
  const handleRegenerateApplication = (application: Application) => {
    toast.success(`Regenerating application ${application.id}`);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (event.metaKey || event.ctrlKey) {
      if (event.key === "l") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("#application-search")?.focus();
      }
    }
  };

  // Add keyboard shortcut listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container pb-8">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="my-4 flex flex-col gap-2">
        <Tabs defaultValue="new" className="space-y-4" onValueChange={handleTabChange}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="new">New Application</TabsTrigger>
              <TabsTrigger value="applications">My Applications</TabsTrigger>
            </TabsList>
            <HotkeysDialog />
          </div>

          <TabsContent value="new" className="space-y-4">
            <JobApplicationForm
              onSubmit={handleFormSubmit}
              isSubmitting={isGeneratingDocs}
              onToggleDocument={toggleDocumentSelection}
              selectedDocuments={selectedDocuments}
            />

            {showDocumentPreviews && currentDocumentContent && (
              <div className="mt-8">
                {/* Document Type Selector */}
                {expandedRowId && (
                  <div className="mb-4">
                    <Tabs value={activeDocumentType || ""} onValueChange={handleSwitchDocument} className="w-full">
                      <TabsList>
                        {generatedApplications
                          .find((app) => app.id === expandedRowId)
                          ?.documents?.map((doc) => (
                            <TabsTrigger key={doc.type} value={doc.type}>
                              {doc.type === "resume" ? "Resume" : "Cover Letter"}
                            </TabsTrigger>
                          ))}
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                <DocumentPreview
                  title={activeDocumentType === "resume" ? "Resume" : "Cover Letter"}
                  content={currentDocumentContent.content}
                  contentType={currentDocumentContent.contentType}
                  htmlContent={currentDocumentContent.htmlContent}
                  fileName={currentDocumentContent.fileName}
                  applicationId={expandedRowId || undefined}
                  documentType={activeDocumentType || undefined}
                  onFileNameChange={activeDocumentType === "resume" ? setResumeFileName : setCoverLetterFileName}
                  isEditingFileName={activeDocumentType === "resume" ? isEditingResumeFileName : isEditingCoverLetterFileName}
                  onEditFileName={() =>
                    activeDocumentType === "resume" ? setIsEditingResumeFileName(true) : setIsEditingCoverLetterFileName(true)
                  }
                  onSaveFileName={() =>
                    activeDocumentType === "resume" ? setIsEditingResumeFileName(false) : setIsEditingCoverLetterFileName(false)
                  }
                  onDownload={() =>
                    handleDownload(activeDocumentType === "resume" ? "resume" : "coverLetter", expandedRowId || "")
                  }
                  onContentChange={handleContentChange}
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
              applications={paginatedApplications}
              expandedRowId={expandedRowId}
              onToggleRow={handleRowToggle}
              onViewApplication={handleViewApplication}
              onDownloadApplication={handleDownloadApplication}
              onRegenerateApplication={handleRegenerateApplication}
              isLoading={isLoadingApplications}
              showAtsScore={true}
            />

            {filteredApplications.length > 0 && (
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {expandedRowId && (
        <div className="mt-8">
          <ATSScoreAnalysis
            score={generatedApplications.find((a) => a.id === expandedRowId)?.atsScore || 0}
            strengths={atsStrengths}
            weaknesses={atsWeaknesses}
          />
        </div>
      )}
    </div>
  );
}
