import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

interface DocumentGeneratorProps {
  isGenerating?: boolean;
  onGenerate: (jobDescription: string, skills: string, education: string, experience: string) => void;
}

export function DocumentGenerator({ isGenerating = false, onGenerate }: DocumentGeneratorProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onGenerate(jobDescription, skills, education, experience);
  };

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-4">Generate Resume & Cover Letter</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium mb-1">
            Job Description
          </label>
          <Textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="min-h-24"
            required
          />
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium mb-1">
            Your Skills
          </label>
          <Textarea
            id="skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="List your relevant skills..."
            className="min-h-20"
            required
          />
        </div>

        <div>
          <label htmlFor="education" className="block text-sm font-medium mb-1">
            Your Education
          </label>
          <Textarea
            id="education"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="List your education background..."
            className="min-h-20"
            required
          />
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm font-medium mb-1">
            Your Experience
          </label>
          <Textarea
            id="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Describe your relevant work experience..."
            className="min-h-20"
            required
          />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Documents...
              </>
            ) : (
              "Generate Documents"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
