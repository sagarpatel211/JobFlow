import { useState } from "react";
import { FileUpload } from "../../../../../components/ui/file-upload";

export function UploadSection() {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeLatexZip, setResumeLatexZip] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<File | null>(null);

  return (
    <div className="flex flex-col gap-4 h-full">
      <FileUpload title="Upload Profile Picture" onFileChange={(file) => setProfilePic(file)} />
      {profilePic && <p>Selected Profile Picture: {profilePic.name}</p>}

      <FileUpload title="Upload Resume (LaTeX)" onFileChange={(file) => setResume(file)} />
      {resume && <p>Selected Resume: {resume.name}</p>}

      <FileUpload title="Upload Resume LaTeX (.zip)" onFileChange={(file) => setResumeLatexZip(file)} accept=".zip" />
      {resumeLatexZip && <p>Selected Resume LaTeX Zip: {resumeLatexZip.name}</p>}

      <FileUpload title="Upload Cover Letter" onFileChange={(file) => setCoverLetter(file)} />
      {coverLetter && <p>Selected Cover Letter: {coverLetter.name}</p>}

      <FileUpload title="Upload Transcript" onFileChange={(file) => setTranscript(file)} />
      {transcript && <p>Selected Transcript: {transcript.name}</p>}
    </div>
  );
}
