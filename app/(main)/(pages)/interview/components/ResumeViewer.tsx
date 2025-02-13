"use client";

import React from "react";

const ResumeViewer = () => {
  const resumeText = `John Doe
Software Engineer

Experience:
- Company A: Developed awesome features.
- Company B: Improved performance by 30%.

Education:
- B.S. in Computer Science

Skills:
- React, Node.js, Python, etc.
  `;
  return (
    <div className="p-4 border rounded-md h-full overflow-auto">
      <pre>{resumeText}</pre>
    </div>
  );
};

export default ResumeViewer;
