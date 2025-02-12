// components/ResumeScreeningInterview.jsx
"use client";

import React, { useState } from "react";
import InterviewHeader from "./InterviewHeader";
import ChatInterface from "./ChatInterface";
import ResumeViewer from "./ResumeViewer";

const ResumeScreeningInterview = ({ onExit, duration }) => {
  const [messages, setMessages] = useState([]);

  return (
    <div className="flex flex-col h-screen">
      <InterviewHeader onExit={onExit} duration={duration} />
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-2xl mb-4">Resume Screening Interview</h2>
        <div className="flex flex-col md:flex-row gap-4 flex-grow">
          {/* Chat side */}
          <div className="flex-1">
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              botReply="Bot response for resume screening."
            />
          </div>
          {/* Resume side */}
          <div className="flex-1">
            <ResumeViewer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeScreeningInterview;
