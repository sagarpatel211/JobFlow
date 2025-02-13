"use client";

import React, { useState, useRef, useEffect } from "react";
import InterviewHeader from "./InterviewHeader";

const BehavioralInterview = ({ onExit, duration }) => {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    chatContainerRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.code === "Space" && !isRecording) {
      setIsRecording(true);
    }
  };

  const handleKeyUp = (e) => {
    if (e.code === "Space" && isRecording) {
      setIsRecording(false);
      const simulatedText = "Simulated speech input";
      setMessages((prev) => [...prev, { sender: "user", text: simulatedText }]);
      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: "bot", text: "This is a bot response." }]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <InterviewHeader onExit={onExit} duration={duration} />
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-2xl mb-4">Behavioral Interview</h2>
        <div
          ref={chatContainerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className="flex flex-col flex-grow p-4 border rounded-md outline-none"
        >
          <div className="flex-grow overflow-auto mb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-2 p-2 rounded max-w-[70%] ${
                  msg.sender === "user" ? "bg-blue-100 self-end text-right" : "bg-gray-100 self-start text-left"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="text-center p-2 border-t">
            {isRecording ? "Recording... (release space to end)" : "Hold space to speak"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehavioralInterview;
