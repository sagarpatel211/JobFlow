"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const CoverLetterForm = () => {
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);
    // Simulate an asynchronous operation (e.g., generating PDF)
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 5000);
  };

  const handleClear = () => {
    setShowResults(false);
    setLoading(false);
  };

  return (
    <div className="flex gap-8 p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-1/2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" placeholder="Company Name" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="roleName">Role Name</Label>
          <Input id="roleName" placeholder="Role Name" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="companyAddress">Company Address</Label>
          <Input id="companyAddress" placeholder="Company Address" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="jobPosting">Job Posting</Label>
          <Textarea id="jobPosting" placeholder="Paste job posting here..." />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="dateField">Date</Label>
          <Input id="dateField" type="date" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Submit"}
        </Button>
      </form>
      <div className="w-1/2 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="animate-spin" size={48} />
            <span className="mt-4">Generating PDF...</span>
          </div>
        )}
        {showResults && !loading && (
          <>
            <div className="border border-dashed h-96 flex items-center justify-center">
              <span>Empty PDF</span>
            </div>
            <div className="flex flex-col gap-2">
              <Progress value={50} className="h-4" />
              <p className="text-sm text-muted-foreground">
                ATS Score: 50%. This score indicates that your profile partially matches the job posting
                requirements.
              </p>
            </div>
            <Button variant="destructive" onClick={handleClear}>
              Clear
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CoverLetterForm;
