import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

interface QASectionProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  formValues: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function QASection({
  currentStep,
  totalSteps,
  isSubmitting,
  formValues,
  onChange,
  onNext,
  onBack,
  onSubmit,
}: QASectionProps) {
  const renderFormField = (fieldName: string, label: string, type: "input" | "textarea" = "input") => {
    const value = formValues[fieldName] || "";

    return (
      <div className="space-y-2">
        <Label htmlFor={fieldName}>{label}</Label>
        {type === "input" ? (
          <Input id={fieldName} value={value} onChange={(e) => onChange(fieldName, e.target.value)} />
        ) : (
          <Textarea id={fieldName} value={value} onChange={(e) => onChange(fieldName, e.target.value)} rows={5} />
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {renderFormField("jobTitle", "Job Title")}
            {renderFormField("company", "Company")}
            {renderFormField("jobDescription", "Job Description", "textarea")}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            {renderFormField("skills", "Your Skills", "textarea")}
            {renderFormField("experience", "Your Work Experience", "textarea")}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            {renderFormField("education", "Your Education", "textarea")}
            {renderFormField("additionalInfo", "Additional Information (Optional)", "textarea")}
          </div>
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Job Application Questionnaire</CardTitle>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
      </CardHeader>
      <CardContent className="flex-1">{renderCurrentStep()}</CardContent>
      <div className="p-4 border-t flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={currentStep === 1 || isSubmitting}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={isLastStep ? onSubmit : onNext} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {isLastStep ? "Generate Documents" : "Next"}
              {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
