"use client";

import React, { useState } from "react";
import InterviewHeader from "./interviewheader";
import Editor from "@monaco-editor/react";

interface TechnicalInterviewProps {
  onExit: () => void;
  duration: number;
}

const TechnicalInterview: React.FC<TechnicalInterviewProps> = ({ onExit, duration }) => {
  const [code, setCode] = useState("// Write your code here...");

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || value === null) {
      setCode("");
    } else {
      setCode(value);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <InterviewHeader onExit={onExit} duration={duration} />
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-2xl mb-4">Technical Interview</h2>
        <Editor height="70vh" defaultLanguage="javascript" value={code} onChange={handleEditorChange} theme="vs-dark" />
      </div>
    </div>
  );
};

export default TechnicalInterview;
