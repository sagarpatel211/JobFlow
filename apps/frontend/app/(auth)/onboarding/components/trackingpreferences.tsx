"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrackingPreferencesFormProps, Option } from "@/types/onboarding";

export default function TrackingPreferencesForm({
  formData,
  handleCheckboxChange,
  handleInputChange,
}: TrackingPreferencesFormProps) {
  const options: Option[] = [
    { name: "leetcodeEnabled", label: "LeetCode" },
    { name: "behaviouralEnabled", label: "Behavioural" },
    { name: "jobsEnabled", label: "Job Listings" },
    { name: "systemDesignEnabled", label: "System Design" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Tracking Preferences</h1>
      <div className="space-y-4">
        {options.map((option) => {
          const goalField =
            option.name === "leetcodeEnabled"
              ? "leetcodeGoal"
              : option.name === "behaviouralEnabled"
                ? "behaviouralGoal"
                : option.name === "jobsEnabled"
                  ? "jobsGoal"
                  : "systemDesignGoal";
          return (
            <div key={option.name} className="p-2">
              <div className="flex items-center space-x-4">
                <Checkbox
                  className="h-8 w-8"
                  id={option.name}
                  checked={Boolean(formData[option.name])}
                  onCheckedChange={(checked: boolean) => {
                    handleCheckboxChange(option.name, checked);
                  }}
                />
                <Label htmlFor={option.name} className="text-lg">
                  {option.label}
                </Label>
                {formData[option.name] && (
                  <Input
                    type="number"
                    name={goalField}
                    value={formData[goalField]}
                    onChange={handleInputChange}
                    placeholder="Goal"
                    className="w-20"
                    min={1}
                    max={15}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
