import { useState } from "react";
import { FileUpload } from "./file-upload";

export function UploadSection() {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<File | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <FileUpload title="Upload Profile Picture" onFileChange={(file) => setProfilePic(file)} />
      <FileUpload title="Upload Resume" onFileChange={(file) => setResume(file)} />
      <FileUpload title="Upload Transcript" onFileChange={(file) => setTranscript(file)} />
    </div>
  );
}
