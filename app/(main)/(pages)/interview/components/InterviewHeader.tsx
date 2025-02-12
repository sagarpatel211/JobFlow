// components/InterviewHeader.jsx
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const InterviewHeader = ({ onExit, duration }) => {
  const totalSeconds = duration * 60;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const newElapsed = prev + 1;
        if (newElapsed >= totalSeconds) {
          clearInterval(interval);
          return totalSeconds;
        }
        return newElapsed;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalSeconds]);

  const progressPercent = (elapsed / totalSeconds) * 100;

  return (
    <div className="flex items-center justify-between p-2 border-b">
      <Button variant="ghost" onClick={onExit}>
        Exit
      </Button>
      <div className="w-1/3">
        <Progress value={progressPercent} />
      </div>
    </div>
  );
};

export default InterviewHeader;
