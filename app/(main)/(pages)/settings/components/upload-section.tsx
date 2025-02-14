import { useState } from "react";
import { FileUpload } from "./file-upload";

export function UploadSection() {
  const [profilePic, setProfilePic] = useState(null);
  const [resume, setResume] = useState(null);
  const [transcript, setTranscript] = useState(null);

  return (
    // "h-full" lets this section fill the height provided by the grid cell.
    <div className="flex flex-col gap-6 h-full">
      <FileUpload title="Upload Profile Picture" onFileChange={(file) => setProfilePic(file)} />
      <FileUpload title="Upload Resume" onFileChange={(file) => setResume(file)} />
      <FileUpload title="Upload Transcript" onFileChange={(file) => setTranscript(file)} />
      <FileUpload title="Upload Resume LaTeX (.zip)" onFileChange={(file) => setTranscript(file)} />
    </div>
  );
}
