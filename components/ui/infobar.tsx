"use client";
import React, { useEffect, useState } from "react";
import { LogOut, Minus, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HealthBarProps, PaymentDetails, ProgressItem } from "@/types/infobar";

const mockPaymentDetails = async () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ tier: "Pro", credits: 42 });
    }, 1000);
  });

const HealthBar: React.FC<HealthBarProps> = ({ value, maxValue, color }) => (
  <div className="flex gap-[2px]">
    {Array.from({ length: maxValue }, (_, index) => (
      <div key={index} className={`w-3 h-2 rounded-full ${index < value ? color : "bg-gray-700"}`} />
    ))}
  </div>
);

const InfoBar = () => {
  const [tier, setTier] = useState("Free");
  const [credits, setCredits] = useState(0);
  const [leetcodeDone, setLeetcodeDone] = useState(0);
  const [jobsApplied, setJobsApplied] = useState(0);
  const [behavioralDone, setBehavioralDone] = useState(0);
  const [systemDesignDone, setSystemDesignDone] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await mockPaymentDetails();
        const { tier, credits } = result as PaymentDetails;
        setTier(tier);
        setCredits(credits);
      } catch (error) {
        console.error("Error fetching payment details:", error);
      }
    };
    void fetchData();
  }, []);

  const getTextColor = (value: number, maxValue: number): string =>
    value >= maxValue ? "text-green-400" : "text-gray-300";

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
    <div className="flex justify-end items-center gap-8 px-3 py-3 w-full dark:bg-black text-white">
      <div className="flex items-center gap-8">
        {progressItems.map(({ label, value, setValue, maxValue, color }) => (
          <div key={label} className="flex items-center gap-2 min-w-[160px]">
            <p className={`text-xs font-semibold min-w-[50px] text-center ${getTextColor(value, maxValue)}`}>
              {`${label}: ${value.toString()} / ${maxValue.toString()}`}
            </p>
            <Minus
              size={14}
              className="cursor-pointer text-gray-400 hover:text-white"
              onClick={() => {
                setValue(Math.max(0, value - 1));
              }}
            />
            <HealthBar value={Math.min(value, maxValue)} maxValue={maxValue} color={color} />
            <Plus
              size={14}
              className="cursor-pointer text-gray-400 hover:text-white"
              onClick={() => {
                setValue(value + 1);
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2 font-bold pr-4">
          <p className="text-sm font-light text-gray-300">Credits</p>
          {tier === "Unlimited"
            ? "Unlimited"
            : `${credits.toString()}/${tier === "Free" ? "10" : tier === "Pro" ? "100" : "0"}`}
        </span>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="cursor-pointer text-gray-400 hover:text-white" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Log Out</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default InfoBar;
