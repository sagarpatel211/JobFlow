"use client";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CoverLetterForm from "./components/coverletter";
import ResumeSection from "./components/resumesection";

const GenerateAppPage = () => {
  const [coverLetterEnabled, setCoverLetterEnabled] = useState(true);
  const [resumeEnabled, setResumeEnabled] = useState(false);

  return (
    <div className="flex flex-col gap-4 relative">
      <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b">
        Generate Application
      </h1>
      <div className="flex gap-8 items-center p-6">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={coverLetterEnabled}
            onCheckedChange={(checked) => setCoverLetterEnabled(checked === true)}
          />
          <Label>Cover Letter</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={resumeEnabled}
            onCheckedChange={(checked) => setResumeEnabled(checked === true)}
          />
          <Label>Resume</Label>
        </div>
      </div>
      {coverLetterEnabled && <CoverLetterForm />}
      {resumeEnabled && <ResumeSection />}
    </div>
  );
};

export default GenerateAppPage;
