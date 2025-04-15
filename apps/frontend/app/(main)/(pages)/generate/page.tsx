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
}

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

  // Generated Applications List
  const [generatedApplications, setGeneratedApplications] = useState<Application[]>([
    {
      id: "1",
      company: "Google",
      jobTitle: "Software Engineer",
      status: "completed" as const,
      atsScore: 85,
      createdAt: new Date("2023-05-15").toISOString(),
    },
    {
      id: "2",
      company: "Microsoft",
      jobTitle: "Full Stack Developer",
      status: "completed" as const,
      atsScore: 92,
      createdAt: new Date("2023-06-21").toISOString(),
    },
    {
      id: "3",
      company: "Amazon",
      jobTitle: "DevOps Engineer",
      status: "completed" as const,
      atsScore: 78,
      createdAt: new Date("2023-07-08").toISOString(),
    },
    {
      id: "4",
      company: "Netflix",
      jobTitle: "Frontend Engineer",
      status: "pending" as const,
      atsScore: 0,
      createdAt: new Date("2023-08-15").toISOString(),
    },
    {
      id: "5",
      company: "Facebook",
      jobTitle: "Machine Learning Engineer",
      status: "completed" as const,
      atsScore: 91,
      createdAt: new Date("2023-09-03").toISOString(),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("new");

  // Pagination
  const ITEMS_PER_PAGE = 3;
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for document preview
  const mockResume = `JOHN DOE
Software Engineer

CONTACT
Phone: (123) 456-7890
Email: john.doe@example.com
LinkedIn: linkedin.com/in/johndoe
GitHub: github.com/johndoe

SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Passionate about creating scalable and user-friendly applications.

EXPERIENCE
Senior Software Engineer | Tech Innovators Inc. | Jan 2020 - Present
- Led the development of a customer-facing web application that increased user engagement by 35%
- Implemented CI/CD pipelines that reduced deployment time by 50%
- Mentored junior developers and conducted code reviews

Software Engineer | Digital Solutions LLC | Mar 2017 - Dec 2019
- Developed RESTful APIs using Node.js and Express
- Collaborated with UX designers to implement responsive interfaces
- Optimized database queries resulting in 40% faster load times

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2013 - 2017

SKILLS
Languages: JavaScript, TypeScript, HTML, CSS, Python
Frameworks: React, Node.js, Express, Next.js
Tools: Git, Docker, AWS, Azure, Jenkins
Concepts: REST APIs, Microservices, Agile, TDD`;

  const mockCoverLetter = `John Doe
123 Main Street
Anytown, ST 12345
john.doe@example.com
(123) 456-7890

November 15, 2023

Hiring Manager
Tech Solutions Inc.
456 Business Ave.
Techville, ST 67890

Dear Hiring Manager,

I am writing to express my interest in the Frontend Developer position at Tech Solutions Inc. With over 5 years of experience in web development and a strong focus on frontend technologies, I believe I would be a valuable addition to your team.

My experience with React, JavaScript, and modern frontend frameworks aligns perfectly with the requirements outlined in your job description. In my current role as a Senior Software Engineer at Tech Innovators Inc., I've led the development of responsive, user-friendly web applications that have significantly improved user engagement and business metrics.

I'm particularly impressed by Tech Solutions' commitment to innovation and your recent project involving AI-enhanced user interfaces. My background in implementing complex UI components and optimizing web performance would allow me to contribute immediately to these initiatives.

I'm excited about the possibility of bringing my technical expertise and collaborative approach to Tech Solutions Inc. Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience can benefit your team.

Sincerely,
John Doe`;

  // Mock ATS analysis data
  const mockATSData = {
    score: 85,
    keywords: ["React", "JavaScript", "TypeScript", "Node.js", "Frontend"],
    missedKeywords: ["Angular", "Vue.js", "AWS Amplify"],
    feedback:
      "Consider adding more details about your experience with cloud services and CI/CD pipelines. Include specific metrics about the impact of your work.",
  };

  // Toggle document selection
  const toggleDocumentSelection = useCallback((docType: string) => {
    setSelectedDocuments((prev) => (prev.includes(docType) ? prev.filter((doc) => doc !== docType) : [...prev, docType]));
  }, []);

  // Handle row expansion
  const handleRowToggle = useCallback((id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
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
  const handleFormSubmit = (values: FormValues) => {
    console.log("Form submitted:", values);
    // In a real app, this would trigger an API call to generate the application
    setCompany(values.company);
    setJobTitle(values.jobTitle);
    setJobDescription(values.jobDescription);

    // Simulate document generation
    setTimeout(() => {
      // Add new application to the list
      const newApp: Application = {
        id: String(generatedApplications.length + 1),
        company: values.company,
        jobTitle: values.jobTitle,
        status: "completed" as const,
        atsScore: Math.floor(Math.random() * 20) + 75, // Random score between 75-95
        createdAt: new Date().toISOString(),
      };

      setGeneratedApplications([newApp, ...generatedApplications]);
      toast.success("Application generated successfully!");
    }, 2000);
  };

  const handleDownload = (documentType: "resume" | "coverLetter") => {
    console.log(`Downloading ${documentType}`);
    // In a real app, this would trigger a download
    toast.success(`Downloading ${documentType === "resume" ? "resume" : "cover letter"}`);
  };

  const handleViewApplication = (application: Application) => {
    console.log(`Viewing application ${application.id}`);
    // In a real app, this would navigate to the application details
    toast.success(`Viewing application ${application.id}`);
  };

  const handleDownloadApplication = (application: Application) => {
    console.log(`Downloading application ${application.id}`);
    // In a real app, this would trigger a download
    toast.success(`Downloading application ${application.id}`);
  };

  const handleRegenerateApplication = (application: Application) => {
    console.log(`Regenerating application ${application.id}`);
    // In a real app, this would trigger regeneration
    toast.success(`Regenerating application ${application.id}`);
  };

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      toast.success("Next page");
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      toast.success("Previous page");
    }
  }, [currentPage]);

  const createNewApplication = useCallback(() => {
    setActiveTab("new");
    toast.success("Create new application");
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            goToPrevPage();
            break;
          case "ArrowRight":
            event.preventDefault();
            goToNextPage();
            break;
          case " ":
            event.preventDefault();
            createNewApplication();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToNextPage, goToPrevPage, createNewApplication]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="p-4">
      <Toaster
        toastOptions={{
          style: {
            maxWidth: "500px",
            background: isDark ? "#111" : "#fff",
            color: isDark ? "#fff" : "#000",
            border: isDark ? "1px solid #333" : "1px solid #ddd",
          },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-4 md:p-6 text-3xl md:text-4xl backdrop-blur-lg mb-6">
        <span>Generate Application</span>
        <HotkeysDialog />
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="new">New Application</TabsTrigger>
          <TabsTrigger value="history">Application History</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <JobApplicationForm onSubmit={handleFormSubmit} resumeData={mockResume} isLoading={isGeneratingDocs} />

            <div className="space-y-6">
              <DocumentPreview resume={mockResume} coverLetter={mockCoverLetter} onDownload={handleDownload} />

              <ATSScoreAnalysis
                score={mockATSData.score}
                keywords={mockATSData.keywords}
                missedKeywords={mockATSData.missedKeywords}
                feedback={mockATSData.feedback}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ApplicationsTable
            applications={paginatedApplications}
            onView={handleViewApplication}
            onDownload={handleDownloadApplication}
            onRegenerate={handleRegenerateApplication}
          />

          {/* Pagination controls */}
          {filteredApplications.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onNext={goToNextPage}
              onPrev={goToPrevPage}
              onGoToPage={setCurrentPage}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
