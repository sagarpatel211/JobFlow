import { useState, useEffect } from "react";
import { FileUpload } from "../../../../../components/ui/file-upload";
import { getProfile } from "@/app/(auth)/services/api";

export function UploadSection() {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeLatexZip, setResumeLatexZip] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<File | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [existingCoverLetterUrl, setExistingCoverLetterUrl] = useState<string | null>(null);
  const [existingTranscriptUrl, setExistingTranscriptUrl] = useState<string | null>(null);
  const [existingLatexUrl, setExistingLatexUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const profile = await getProfile();
        setExistingResumeUrl(profile.resumeUrl || null);
        setExistingCoverLetterUrl(profile.coverLetterUrl || null);
        setExistingTranscriptUrl(profile.transcriptUrl || null);
        setExistingLatexUrl(profile.latexUrl || null);
      } catch (err) {
        console.error("Failed to load existing files:", err);
      }
    };
    void loadExisting();
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <FileUpload title="Upload Profile Picture" accept="image/*" onFileChange={(file) => setProfilePic(file)} />
      {profilePic && <p>Selected Profile Picture: {profilePic.name}</p>}

      <FileUpload title="Upload Resume (PDF)" accept=".pdf" onFileChange={(file) => setResume(file)} />
      {resume && <p>Selected Resume: {resume.name}</p>}
      {!resume && existingResumeUrl && (
        <p className="text-sm text-gray-600">Existing Resume: {existingResumeUrl.split("/").pop()}</p>
      )}

      <FileUpload title="Upload Resume LaTeX (.zip)" accept=".zip" onFileChange={(file) => setResumeLatexZip(file)} />
      {resumeLatexZip && <p>Selected Resume LaTeX Zip: {resumeLatexZip.name}</p>}
      {!resumeLatexZip && existingLatexUrl && (
        <p className="text-sm text-gray-600">Existing LaTeX Zip: {existingLatexUrl.split("/").pop()}</p>
      )}

      <FileUpload title="Upload Cover Letter" accept=".pdf" onFileChange={(file) => setCoverLetter(file)} />
      {coverLetter && <p>Selected Cover Letter: {coverLetter.name}</p>}
      {!coverLetter && existingCoverLetterUrl && (
        <p className="text-sm text-gray-600">Existing Cover Letter: {existingCoverLetterUrl.split("/").pop()}</p>
      )}

      <FileUpload title="Upload Transcript" accept=".pdf" onFileChange={(file) => setTranscript(file)} />
      {transcript && <p>Selected Transcript: {transcript.name}</p>}
      {!transcript && existingTranscriptUrl && (
        <p className="text-sm text-gray-600">Existing Transcript: {existingTranscriptUrl.split("/").pop()}</p>
      )}
    </div>
  );
}
