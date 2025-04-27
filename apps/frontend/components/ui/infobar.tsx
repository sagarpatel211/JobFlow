"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Minus, Plus, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HealthBarProps, ProgressItem } from "@/types/infobar";
import { HoverBorderGradient } from "./hover-border-gradient";
import { toast, Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import { getProfile, getStats, setStat } from "@/app/(auth)/services/api";

const HealthBar: React.FC<HealthBarProps> = ({ value, maxValue, color }) => (
  <div className="flex gap-[1px]">
    {Array.from({ length: maxValue }, (_, index) => (
      <div
        key={index}
        className={`w-3 h-3 rounded-full 
                    ${index < value ? color : "bg-gray-300 dark:bg-gray-700"}`}
      />
    ))}
  </div>
);

function HoverBorderGradientDemo() {
  return (
    <div className="justify-center text-center h-10 flex items-center">
      <HoverBorderGradient
        containerClassName="rounded-full"
        as="button"
        className="bg-white dark:bg-black text-black dark:text-white flex items-center space-x-2 px-4 py-2 
                   border border-gray-300 dark:border-gray-700 shadow-md dark:shadow-none 
                   hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200"
      >
        <span className="text-sm font-medium">Pro</span>
      </HoverBorderGradient>
    </div>
  );
}

const InfoBar = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [profilePicUrl, setProfilePicUrl] = useState<string>("https://i.pravatar.cc/100");
  const [leetcodeDone, setLeetcodeDone] = useState(0);
  const [jobsApplied, setJobsApplied] = useState(0);
  const [behavioralDone, setBehavioralDone] = useState(0);
  const [systemDesignDone, setSystemDesignDone] = useState(0);
  const [prefs, setPrefs] = useState({
    leetcodeEnabled: false,
    jobsEnabled: false,
    behaviouralEnabled: false,
    systemDesignEnabled: false,
  });
  const statTypeMap: Record<string, string> = {
    Leetcode: "leetcode",
    "Jobs Applied": "jobs_applied",
    Behavioral: "behavioural",
    "System Design": "system_design",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getProfile();
        setPrefs({
          leetcodeEnabled: profile.leetcodeEnabled,
          jobsEnabled: profile.jobsEnabled,
          behaviouralEnabled: profile.behaviouralEnabled,
          systemDesignEnabled: profile.systemDesignEnabled,
        });
        const pic = (profile as any).profilePicUrl;
        setProfilePicUrl(typeof pic === "string" && pic ? pic : "https://i.pravatar.cc/100");
        const stats = await getStats();
        setLeetcodeDone(stats.leetcode ?? 0);
        setJobsApplied(stats.jobs_applied ?? 0);
        setBehavioralDone(stats.behavioural ?? 0);
        setSystemDesignDone(stats.system_design ?? 0);
      } catch (err) {
        console.error("Error fetching stats/profile:", err);
      }
    };
    void fetchData();
  }, []);

  const getTextColor = (value: number, maxValue: number): string =>
    value >= maxValue ? "text-green-400" : "dark:text-gray-300 text-gray-900";

  const progressItems: ProgressItem[] = [
    {
      label: "Leetcode",
      value: leetcodeDone,
      setValue: setLeetcodeDone,
      maxValue: 5,
      color: "bg-pink-500",
    },
    {
      label: "Jobs Applied",
      value: jobsApplied,
      setValue: setJobsApplied,
      maxValue: 15,
      color: "bg-blue-400",
    },
    {
      label: "Behavioral",
      value: behavioralDone,
      setValue: setBehavioralDone,
      maxValue: 1,
      color: "bg-purple-400",
    },
    {
      label: "System Design",
      value: systemDesignDone,
      setValue: setSystemDesignDone,
      maxValue: 1,
      color: "bg-orange-400",
    },
  ];

  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            background: isDark ? "#333" : "#fff",
            color: isDark ? "#fff" : "#000",
          },
        }}
      />
      <div className="flex justify-end items-center gap-16 px-3 py-3 w-full dark:bg-black text-white">
        <div className="flex items-center gap-12">
          {progressItems
            .filter(
              ({ label }) =>
                (label === "Leetcode" && prefs.leetcodeEnabled) ||
                (label === "Jobs Applied" && prefs.jobsEnabled) ||
                (label === "Behavioral" && prefs.behaviouralEnabled) ||
                (label === "System Design" && prefs.systemDesignEnabled),
            )
            .map(({ label, value, setValue, maxValue, color }) => {
              const statKey = statTypeMap[label];
              return (
                <div key={label} className="flex items-center gap-2 min-w-[160px]">
                  <p className={`text-xs font-semibold min-w-[50px] text-center ${getTextColor(value, maxValue)}`}>
                    {`${label}: ${value.toString()} / ${maxValue.toString()}`}
                  </p>
                  <Minus
                    size={14}
                    className="cursor-pointer text-gray-400 hover:text-white"
                    onClick={() => {
                      const newValue = Math.max(0, value - 1);
                      void setStat(statKey, newValue);
                      setValue(newValue);
                    }}
                  />
                  <HealthBar value={Math.min(value, maxValue)} maxValue={maxValue} color={color} />
                  <Plus
                    size={14}
                    className="cursor-pointer text-gray-400 hover:text-white"
                    onClick={() => {
                      const newValue = Math.min(10, value + 1);
                      void setStat(statKey, newValue);
                      setValue(newValue);
                    }}
                  />
                </div>
              );
            })}
        </div>

        <div className="flex items-center gap-x-6">
          <HoverBorderGradientDemo />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Image
                src={profilePicUrl}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="dark:bg-gray-800 bg-white border-gray-300 dark:border-gray-600 shadow-md rounded-md">
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 cursor-pointer dark:hover:bg-gray-700 hover:bg-gray-100 p-2 rounded-md"
              >
                <Settings size={16} /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  try {
                    localStorage.removeItem("access_token");
                    document.cookie = "access_token=; Path=/; Max-Age=0";
                    toast.dismiss();
                    toast.success("Logged out successfully");
                    router.replace("/login");
                  } catch (error) {
                    toast.error("Failed to log out");
                  }
                }}
                className="flex items-center gap-2 cursor-pointer dark:hover:bg-gray-700 hover:bg-gray-100 p-2 rounded-md"
              >
                <LogOut size={16} /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

export default InfoBar;
