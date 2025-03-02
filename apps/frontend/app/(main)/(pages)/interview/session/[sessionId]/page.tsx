"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BehavioralInterview from "@/app/(main)/(pages)/interview/components/behavioralinterview";
import TechnicalInterview from "@/app/(main)/(pages)/interview/components/technicalinterview";
import ResumeScreeningInterview from "@/app/(main)/(pages)/interview/components/resumescreeninginterview";

const SessionPage = () => {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const interviewType = typeParam !== null && typeParam !== "" ? typeParam : "Behavioral";
  const durationParam = searchParams.get("duration");
  const duration = durationParam !== null && durationParam !== "" ? parseInt(durationParam, 10) : 30;

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
