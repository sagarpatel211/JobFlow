"use client";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentsFormProps } from "@/types/onboarding";

export default function DocumentsForm({ handleFileChange }: DocumentsFormProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Documents Upload</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <FileUpload
            title="Upload Resume"
            onFileChange={(file) => {
              handleFileChange("resume", file);
            }}
          />
        </div>
        <div className="flex flex-col">
          <FileUpload
            title="Upload Cover Letter"
            onFileChange={(file) => {
              handleFileChange("coverLetter", file);
            }}
          />
        </div>
        <div className="flex flex-col">
          <FileUpload
            title="Upload Transcript"
            onFileChange={(file) => {
              handleFileChange("transcript", file);
            }}
          />
        </div>
        <div className="flex flex-col">
          <FileUpload
            title="Upload Resume LaTeX (.zip)"
            onFileChange={(file) => {
              handleFileChange("latex", file);
            }}
          />
        </div>
      </div>
    </div>
  );
}
