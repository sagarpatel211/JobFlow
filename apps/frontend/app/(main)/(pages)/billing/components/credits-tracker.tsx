"use client";
import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type CreditInfo = {
  used: number;
  max: number | "Unlimited";
};

type CreditTrackerProps = {
  interviews: CreditInfo;
  generations: CreditInfo;
  aiApplier: CreditInfo;
};

const CreditTracker = ({ interviews, generations, aiApplier }: CreditTrackerProps) => {
  const getPercentage = (credit: CreditInfo) => (credit.max === "Unlimited" ? 100 : (credit.used / credit.max) * 100);

  const renderCreditRow = (label: string, credit: CreditInfo, defaultColor: string) => {
    const progressClasses =
      credit.max === "Unlimited"
        ? "w-full h-4 rounded bg-gradient-to-r from-purple-300 to-purple-700 animate-pulse"
        : `w-full h-4 rounded ${defaultColor} dark:${defaultColor.replace("500", "400")}`;

    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{label}</span>
          <span className="text-sm">{credit.max === "Unlimited" ? "Unlimited" : `${credit.used}/${credit.max}`}</span>
        </div>
        <Progress value={getPercentage(credit)} className={progressClasses} />
      </div>
    );
  };

  return (
    <Card className="p-6 h-60">
      <CardTitle className="font-light">Credit Tracker</CardTitle>
      <CardContent className="flex flex-col gap-4 mt-4">
        {renderCreditRow("Interviews", interviews, "bg-blue-500")}
        {renderCreditRow("Generations", generations, "bg-green-500")}
        {renderCreditRow("AI Applier", aiApplier, "bg-purple-500")}
      </CardContent>
    </Card>
  );
};

export default CreditTracker;
