import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";

const LoadingScreen = () => {
  return (
    <div className="relative h-screen w-screen">
      <AuroraBackground className="absolute inset-0 -z-10" />
      <div className="relative z-50 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 dark:border-blue-300"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
