"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = ["Step 1", "Step 2", "Step 3", "Finish"];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push("https://ui.aceternity.com/components/multi-step-loader");
      setTimeout(() => {
        router.refresh();
        router.push("/dashboard");
      }, 3000);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Onboarding</h1>
      <div className="flex items-center mb-4 space-x-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full border",
              index <= currentStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
            )}
          >
            {index + 1}
          </div>
        ))}
      </div>
      <p className="mb-6">{steps[currentStep]}</p>
      <div className="flex space-x-4">
        <Button onClick={handlePrev} disabled={currentStep === 0}>
          Previous
        </Button>
        <Button onClick={handleNext}>
          {currentStep === steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
