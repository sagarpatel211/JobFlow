import React, { useState, useEffect, useMemo } from "react";
import { Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { Input } from "@/components/ui/input";
import { getStoredApiKey, setStoredApiKey } from "@/lib/storage";

interface StatusIndicatorProps {
  status: string;
  error?: string;
  progress?: number;
}

interface Job {
  id: number;
  company: string;
  title: string;
  status: string;
  progress?: number;
  error?: string;
  link?: string;
}

interface HomeProps {
  onLogout: () => void;
}

const jobs: Job[] = [
  {
    id: 1,
    company: "Acme Corp",
    title: "Student Developer",
    status: "queued",
    link: "https://explore.jobs.netflix.net/careers/apply?pid=790301171659&query=intern&utm_source=Netflix%20Careersite",
  },
];

const StatusIndicator = ({ status, error, progress }: StatusIndicatorProps) => {
  if (status === "queued") return <span className="text-gray-400 text-xs">Queued</span>;
  if (status === "in_progress")
    return (
      <div className="w-full h-1 bg-gray-700 rounded overflow-hidden">
        <div className="h-full bg-green-500" style={{ width: `${progress}%` }}></div>
      </div>
    );
  if (status === "finished") return <Check className="text-green-500" size={14} />;
  if (status === "failed")
    return (
      <div className="group relative">
        <X className="text-red-500" size={14} />
        <span className="absolute left-5 bottom-0 bg-red-800 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {error}
        </span>
      </div>
    );
  return null;
};

const Home: React.FC<HomeProps> = ({ onLogout }) => {
  const stages = useMemo(() => [0, 0.2, 0.4, 0.8, 1.0], []);
  const buttonTitles = useMemo(
    () => ["Initializing", "Parsing...", "Generating...", "Filling...", "Saved to JobFlow!"],
    []
  );
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [isDirty, setIsDirty] = useState(false); // Track if user made changes

  useEffect(() => {
    getStoredApiKey().then((key) => {
      if (key !== null) {
        setApiKey(key);
      }
    });
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % stages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stages.length]);

  const progress = stages[currentStageIndex];

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value.trim());
    setIsDirty(true);
  };

  const handleApiKeyBlur = async () => {
    if (isDirty) {
      await setStoredApiKey(apiKey);
      toast.success("API Key saved successfully!");
      setIsDirty(false);
    }
  };

  const handleProcessJobs = () => {
    chrome.runtime.sendMessage({ action: "processJobs", jobs: jobs }, (response) => {
      console.log("Background processing response:", response);
      toast.loading("Processing job queue in background...");
    });
  };

  return (
    <div className="w-[400px] h-[500px] mx-auto p-6 shadow-lg bg-black text-white font-sans">
      <h3 className="text-lg font-semibold mb-2">Job Queue</h3>
      <div className="overflow-hidden">
        <div className="rounded overflow-hidden max-h-[100px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-gray-950/40 backdrop-blur-2xl border-b border-gray-600 text-xs">
              <tr>
                <th className="px-2 py-2 text-left w-[35%]">Company</th>
                <th className="px-2 py-2 text-left w-[45%]">Title</th>
                <th className="px-2 py-2 text-left w-[20%]">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-700">
                  <td className="px-2 py-1 truncate w-[35%] max-w-[120px]" title={job.company}>
                    {job.company}
                  </td>
                  <td className="px-2 py-1 truncate w-[45%] max-w-[120px]" title={job.title}>
                    {job.title}
                  </td>
                  <td className="px-2 py-1 w-[20%]">
                    <StatusIndicator
                      status={job.status}
                      error={job.error}
                      progress={job.progress || 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="relative flex flex-col space-y-2 mt-4">
        <Input
          type="text"
          placeholder="Enter OpenAI API Key"
          value={apiKey}
          onChange={handleApiKeyChange}
          onBlur={handleApiKeyBlur}
          className="relative z-10 w-full px-3 py-2 rounded-md bg-neutral-950 text-white border border-neutral-900 focus:ring focus:ring-neutral-500 focus:border-neutral-700"
        />
      </div>
      <h3 className="text-lg font-semibold mt-2 flex items-center">
        <span className="w-[350px] truncate">
          Status: <span className="text-xs mx-1">{jobs[0].company}</span> &{" "}
          <span className="text-xs mx-1">{jobs[0].title}</span>
        </span>
      </h3>
      <div className="h-[90px] flex items-center justify-center">
        <GoogleGeminiEffect progress={progress} buttonTitle={buttonTitles[currentStageIndex]} />
      </div>
      <div className="flex flex-col space-y-3">
        <button
          onClick={handleProcessJobs}
          className="inline-flex h-12 mt-8 w-full animate-shimmer px-4 items-center justify-center rounded-md border-2 border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          Fill Current Page
        </button>
        <button
          onClick={onLogout}
          className="flex items-center justify-center px-4 w-full text-white rounded-md h-12 font-medium bg-red-800 hover:bg-red-700 transition-all duration-300"
          type="button"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Home;
