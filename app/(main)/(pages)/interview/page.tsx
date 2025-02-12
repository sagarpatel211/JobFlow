// app/page.jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const InterviewSetup = () => {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState("Behavioral");
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState("Medium");

  const startInterview = () => {
    // Generate a session ID (here we use the timestamp)
    const sessionId = Date.now();
    // Navigate to the dynamic session URL with query parameters
    router.push(
      `interview/session/${sessionId}?type=${encodeURIComponent(interviewType)}&duration=${duration}&difficulty=${difficulty}`
    );
  };

  return (
    <div className="flex flex-col gap-4 relative p-6">
      <h1 className="text-4xl sticky top-0 z-[10] bg-background/50 backdrop-blur-lg border-b p-6">
        Interview Setup
      </h1>
      <div className="flex flex-col gap-6 items-center justify-center p-6">
        {/* Interview Type Selection */}
        <Select value={interviewType} onValueChange={setInterviewType}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select interview type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Behavioral">Behavioral</SelectItem>
            <SelectItem value="Technical">Technical</SelectItem>
            <SelectItem value="Resume Screening">Resume Screening</SelectItem>
          </SelectContent>
        </Select>

        {/* Duration Slider */}
        <div className="flex flex-col items-center w-64">
          <span className="text-muted-foreground mb-2">
            Duration: {duration} min
          </span>
          <Slider
            max={45}
            min={5}
            step={5}
            value={[duration]}
            onValueChange={(value) => setDuration(value[0])}
          />
        </div>

        {/* Difficulty Selection */}
        <div className="flex gap-2">
          {["Easy", "Medium", "Hard"].map((level) => (
            <Button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-4 py-2 rounded-xl ${
                difficulty === level
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {level}
            </Button>
          ))}
        </div>

        {/* Start Interview Button */}
        <Button
          className="px-6 py-2 bg-primary text-white rounded-lg"
          onClick={startInterview}
        >
          Start Interview
        </Button>
      </div>
    </div>
  );
};

export default InterviewSetup;
