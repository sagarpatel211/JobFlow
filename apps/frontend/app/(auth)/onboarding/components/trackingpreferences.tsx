"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TrackingPreferencesFormProps {
  formData: {
    leetcodeEnabled: boolean;
    behaviouralEnabled: boolean;
    jobsEnabled: boolean;
    systemDesignEnabled: boolean;
  };
  handleCheckboxChange: (field: keyof TrackingPreferencesFormProps["formData"], value: boolean) => void;
}

interface Option {
  name: keyof TrackingPreferencesFormProps["formData"];
  label: string;
}

export default function TrackingPreferencesForm({ formData, handleCheckboxChange }: TrackingPreferencesFormProps) {
  const options: Option[] = [
    { name: "leetcodeEnabled", label: "LeetCode" },
    { name: "behaviouralEnabled", label: "Behavioural" },
    { name: "jobsEnabled", label: "Job Listings" },
    { name: "systemDesignEnabled", label: "System Design" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Tracking Preferences</h1>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.name} className="flex items-center space-x-2">
            <Checkbox
              id={option.name}
              checked={formData[option.name]}
              onCheckedChange={(checked: boolean) => {
                handleCheckboxChange(option.name, checked);
              }}
            />
            <Label htmlFor={option.name}>{option.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
