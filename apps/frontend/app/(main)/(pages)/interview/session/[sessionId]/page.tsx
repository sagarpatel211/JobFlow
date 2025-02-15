"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BehavioralInterview from "@/app/(main)/(pages)/interview/components/BehavioralInterview";
import TechnicalInterview from "@/app/(main)/(pages)/interview/components/TechnicalInterview";
import ResumeScreeningInterview from "@/app/(main)/(pages)/interview/components/ResumeScreeningInterview";

const SessionPage = () => {
  const searchParams = useSearchParams();
  const interviewType = searchParams.get("type") || "Behavioral";
  const duration = parseInt(searchParams.get("duration") || "30", 10);
  // const difficulty = searchParams.get("difficulty") || "Medium";

  const router = useRouter();
  const handleExit = () => {
    router.push("/");
  };

  if (interviewType === "Behavioral") {
    return <BehavioralInterview onExit={handleExit} duration={duration} />;
  } else if (interviewType === "Technical") {
    return <TechnicalInterview onExit={handleExit} duration={duration} />;
  } else if (interviewType === "Resume Screening") {
    return <ResumeScreeningInterview onExit={handleExit} duration={duration} />;
  }

  return <div>Invalid interview type</div>;
};

export default SessionPage;
