"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface JobAutomationFormData {
  preferredJobTitles?: string;
  preferredCompanies?: string;
  autoApply?: boolean;
  additionalNotes?: string;
}

interface JobAutomationFormProps {
  formData: JobAutomationFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (field: keyof JobAutomationFormData, checked: boolean) => void;
}

export default function JobAutomationForm({
  formData,
  handleInputChange,
  handleCheckboxChange,
}: JobAutomationFormProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Job Automation Settings</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="preferredJobTitles">Preferred Job Titles</Label>
          <Input
            name="preferredJobTitles"
            value={formData.preferredJobTitles ?? ""}
            onChange={handleInputChange}
            placeholder="e.g. Software Engineer, Developer"
          />
        </div>
        <div>
          <Label htmlFor="preferredCompanies">Preferred Companies</Label>
          <Input
            name="preferredCompanies"
            value={formData.preferredCompanies ?? ""}
            onChange={handleInputChange}
            placeholder="e.g. Google, Facebook"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="autoApply">Auto-Apply</Label>
          <Checkbox
            id="autoApply"
            checked={formData.autoApply ?? false}
            onCheckedChange={(checked) => {
              handleCheckboxChange("autoApply", Boolean(checked));
            }}
          />
        </div>
        <div>
          <Label htmlFor="additionalNotes">Additional Notes</Label>
          <Textarea
            name="additionalNotes"
            value={formData.additionalNotes ?? ""}
            onChange={handleInputChange}
            placeholder="Any additional preferences or notes"
          />
        </div>
      </div>
    </div>
  );
}
