import React from "react";

const MockInterviewPage = () => {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Mock Interviews</span>
      </h1>
      <div className="flex flex-col items-center justify-center flex-1 p-8">
        <p className="text-2xl font-semibold">Coming Soon...</p>
        <p className="mt-2 text-lg text-muted-foreground">
          We're working hard to bring you mock interview sessions. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default MockInterviewPage;
