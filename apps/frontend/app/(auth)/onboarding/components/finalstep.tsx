"use client";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FinalStepFormProps {
  formData: {
    termsAccepted: boolean;
  };
  handleCheckboxChange: (field: keyof FinalStepFormProps["formData"], value: boolean) => void;
}

export default function FinalStepForm({ formData, handleCheckboxChange }: FinalStepFormProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Final Step</h1>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="termsAccepted"
          checked={formData.termsAccepted}
          onCheckedChange={(checked: boolean) => {
            handleCheckboxChange("termsAccepted", checked);
          }}
        />
        <Label htmlFor="termsAccepted">
          I agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </Label>
      </div>
    </div>
  );
}
