"use client";
import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FinalStepFormProps {
  formData: {
    termsAccepted: boolean;
  };
  handleCheckboxChange: (field: keyof FinalStepFormProps["formData"], value: boolean) => void;
}

export default function FinalStepForm({ formData, handleCheckboxChange }: FinalStepFormProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="w-screen max-w-full px-4">
      <h1 className="text-2xl font-bold mb-3 w-full">Final Step</h1>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="border p-4 overflow-y-auto mb-4 rounded-md w-full max-w-full h-96"
      >
        <h2 className="text-xl font-semibold mb-2">JobFlow Terms of Service & Privacy Policy</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Welcome to JobFlow, your automated job management and tracking tool. The following Terms of Service and
          Privacy Policy (collectively, the "Terms") govern your use of our application and outline your rights and
          responsibilities.
          <br />
          <br />
          <strong>1. Acceptance of Terms</strong>
          <br />
          By accessing or using JobFlow in 2025, you agree to be bound by these Terms. If you do not agree with any part
          of the Terms, please do not use our service.
          <br />
          <br />
          <strong>2. Use of the Service</strong>
          <br />
          JobFlow is designed to automate and track job-related tasks to enhance your workflow. You agree to use the
          service in accordance with all applicable laws and regulations. Unauthorized use or abuse of the service may
          result in termination of your access.
          <br />
          <br />
          <strong>3. Privacy and Data Protection</strong>
          <br />
          Your privacy is important to us. We collect only the necessary personal data to provide and improve our
          service. We do not sell or rent your information to third parties. By using JobFlow, you consent to our
          collection, use, and processing of your data in accordance with this policy.
          <br />
          <br />
          <strong>4. Data Security</strong>
          <br />
          We employ robust security measures to protect your information. However, no method of transmission over the
          Internet or electronic storage is completely secure, and we cannot guarantee absolute security.
          <br />
          <br />
          <strong>5. Changes to the Terms</strong>
          <br />
          We reserve the right to modify these Terms at any time. Any changes will be effective immediately upon posting
          on our platform. Your continued use of JobFlow after any modifications constitutes your acceptance of the new
          Terms.
          <br />
          <br />
          Please scroll to the bottom to indicate that you have read and agree to these Terms.
        </p>
      </div>
      <div className="flex items-center space-x-2 w-screen max-w-full px-4">
        <Checkbox
          id="termsAccepted"
          checked={formData.termsAccepted}
          disabled={!hasScrolledToBottom}
          onCheckedChange={(checked: boolean) => {
            handleCheckboxChange("termsAccepted", checked);
          }}
        />
        <Label htmlFor="termsAccepted" className="w-full">
          I agree to the Terms of Service and Privacy Policy
        </Label>
      </div>
    </div>
  );
}
