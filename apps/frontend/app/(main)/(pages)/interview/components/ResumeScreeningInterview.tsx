"use client";

import React, { useState } from "react";
import InterviewHeader from "./interviewheader";
import ChatInterface from "./chatinterface";
import ResumeViewer from "./resumeviewer";
import { Message } from "@/types/interview";

interface ResumeScreeningInterviewProps {
  onExit: () => void;
  duration: number;
}

const ResumeScreeningInterview = ({ onExit, duration }: ResumeScreeningInterviewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div className="flex flex-col h-screen">
      <InterviewHeader onExit={onExit} duration={duration} />
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-2xl mb-4">Resume Screening Interview</h2>
        <div className="flex flex-col md:flex-row gap-4 flex-grow">
          <div className="flex-1">
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              botReply="Bot response for resume screening."
            />
          </div>
          <div className="flex-1">
            <ResumeViewer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeScreeningInterview;
