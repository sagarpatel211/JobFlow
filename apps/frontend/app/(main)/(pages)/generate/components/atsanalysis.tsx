import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ATSScoreAnalysisProps {
  score: number;
  keywords: string[];
  missedKeywords: string[];
  feedback: string;
}

export function ATSScoreAnalysis({ score, keywords = [], missedKeywords = [], feedback = "" }: ATSScoreAnalysisProps) {
  // Helper function to determine the color based on the score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Helper function to determine the progress color based on the score
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ATS Score Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Resume ATS Compatibility Score</span>
            <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}%</span>
          </div>
          <Progress value={score} className={cn("h-2", getProgressColor(score))} />
        </div>

        <div>
          <h4 className="font-medium mb-2">Detected Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {keywords.length > 0 ? (
              keywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No keywords detected</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Missing Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {missedKeywords.length > 0 ? (
              missedKeywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No missing keywords</span>
            )}
          </div>
        </div>

        {feedback && (
          <div>
            <h4 className="font-medium mb-2">Improvement Suggestions</h4>
            <p className="text-sm text-muted-foreground">{feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
