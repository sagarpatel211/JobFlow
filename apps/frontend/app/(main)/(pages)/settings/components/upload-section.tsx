import { useState } from "react";
import { FileUpload } from "./file-upload";

export function UploadSection() {
  const [_profilePic, setProfilePic] = useState<File | null>(null);
  const [_resume, setResume] = useState<File | null>(null);
  const [_transcript, setTranscript] = useState<File | null>(null);

  return (
    <div className="flex flex-col gap-6 h-full">
      <FileUpload
        title="Upload Profile Picture"
        onFileChange={(file) => {
          setProfilePic(file);
        }}
      />
      <FileUpload
        title="Upload Resume"
        onFileChange={(file) => {
          setResume(file);
        }}
      />
      <FileUpload
        title="Upload Transcript"
        onFileChange={(file) => {
          setTranscript(file);
        }}
      />
      <FileUpload
        title="Upload Resume LaTeX (.zip)"
        onFileChange={(file) => {
          setTranscript(file);
        }}
      />
    </div>
  );
}
