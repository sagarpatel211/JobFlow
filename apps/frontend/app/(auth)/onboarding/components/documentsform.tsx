"use client";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentsFormProps } from "@/types/onboarding";
import { uploadDocument } from "../../services/api";
import { toast } from "react-hot-toast";

export default function DocumentsForm({
  resumeUrl,
  coverLetterUrl,
  transcriptUrl,
  latexUrl,
  handleFileChange,
}: DocumentsFormProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Documents Upload</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <FileUpload
            title="Upload Resume"
            onFileChange={async (file) => {
              try {
                const { url } = await uploadDocument("resume", file);
                handleFileChange("resumeUrl", url);
                toast.success("Resume uploaded");
              } catch (err) {
                console.error(err);
                toast.error("Failed to upload resume.");
              }
            }}
          />
          {resumeUrl && <p className="text-sm">Uploaded: {resumeUrl}</p>}
        </div>
        <div className="flex flex-col">
          <FileUpload
            title="Upload Cover Letter"
            onFileChange={async (file) => {
              try {
                const { url } = await uploadDocument("coverLetter", file);
                handleFileChange("coverLetterUrl", url);
                toast.success("Cover Letter uploaded");
              } catch (err) {
                console.error(err);
                toast.error("Failed to upload cover letter.");
              }
            }}
          />
          {coverLetterUrl && <p className="text-sm">Uploaded: {coverLetterUrl}</p>}
        </div>
        <div className="flex flex-col">
          <FileUpload
            title="Upload Transcript"
            onFileChange={async (file) => {
              try {
                const { url } = await uploadDocument("transcript", file);
                handleFileChange("transcriptUrl", url);
                toast.success("Transcript uploaded");
              } catch (err) {
                console.error(err);
                toast.error("Failed to upload transcript.");
              }
            }}
          />
          {transcriptUrl && <p className="text-sm">Uploaded: {transcriptUrl}</p>}
        </div>
        <div className="flex flex-col">
          <FileUpload
            title="Upload Resume LaTeX (.zip)"
            onFileChange={async (file) => {
              try {
                const { url } = await uploadDocument("latex", file);
                handleFileChange("latexUrl", url);
                toast.success("Resume LaTeX uploaded");
              } catch (err) {
                console.error(err);
                toast.error("Failed to upload resume LaTeX.");
              }
            }}
          />
          {latexUrl && <p className="text-sm">Uploaded: {latexUrl}</p>}
        </div>
      </div>
    </div>
  );
}
