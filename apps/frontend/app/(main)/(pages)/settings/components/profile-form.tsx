"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { UploadSection } from "./upload-section";
import { useToast } from "@/hooks/use-toast"; // Correct import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select component

const ProfileForm = () => {
  const { toast } = useToast(); // Use useToast hook
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [university, setUniversity] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // LeetCode states
  const [leetcodeEnabled, setLeetcodeEnabled] = useState(false);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [leetcodeGoal, setLeetcodeGoal] = useState("");

  // Other track states
  const [behaviouralEnabled, setBehaviouralEnabled] = useState(false);
  const [behaviouralGoal, setBehaviouralGoal] = useState("");

  const [jobsEnabled, setJobsEnabled] = useState(false);
  const [jobsGoal, setJobsGoal] = useState("");

  const [systemDesignEnabled, setSystemDesignEnabled] = useState(false);
  const [systemDesignGoal, setSystemDesignGoal] = useState("");

  // Archive unapplied jobs state
  const [archiveDuration, setArchiveDuration] = useState("A Month");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate an API call that returns a boolean
    setTimeout(() => {
      setIsLoading(false);
      const saveSuccess = true; // Simulate a successful save response

      if (saveSuccess) {
        toast({
          title: "Settings Saved",
          description: "Your user settings have been saved successfully.",
          variant: "default", // Adjust variant if needed
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save your settings.",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  return (
    <div className="grid grid-cols-2 gap-8 items-stretch">
      <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
        <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University" />
        <Textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} placeholder="About Me" />
        <Input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone Number"
          type="tel"
        />

        {/* Archive Unapplied Jobs Dropdown */}
        <div>
          <label className="block text-sm font-medium">Automatically Archive Unapplied Jobs</label>
          <Select value={archiveDuration} onValueChange={setArchiveDuration}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2 Weeks">2 Weeks</SelectItem>
              <SelectItem value="A Month">A Month</SelectItem>
              <SelectItem value="3 Months">3 Months</SelectItem>
              <SelectItem value="A Year">A Year</SelectItem>
              <SelectItem value="Never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Checkbox id="leetcode" checked={leetcodeEnabled} onCheckedChange={setLeetcodeEnabled} />
            <label htmlFor="leetcode" className="ml-2">
              Track LeetCode
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox id="behavioural" checked={behaviouralEnabled} onCheckedChange={setBehaviouralEnabled} />
            <label htmlFor="behavioural" className="ml-2">
              Track Behavioral
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox id="jobs" checked={jobsEnabled} onCheckedChange={setJobsEnabled} />
            <label htmlFor="jobs" className="ml-2">
              Track Jobs Applied
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox id="systemDesign" checked={systemDesignEnabled} onCheckedChange={setSystemDesignEnabled} />
            <label htmlFor="systemDesign" className="ml-2">
              Track System Design
            </label>
          </div>
        </div>

        {leetcodeEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
              placeholder="LeetCode Username"
              className="w-full"
            />
            <Input
              value={leetcodeGoal}
              onChange={(e) => setLeetcodeGoal(e.target.value)}
              placeholder="LeetCode Goal"
              type="number"
              max={10}
              className="w-full"
            />
          </div>
        )}

        {behaviouralEnabled && (
          <Input
            value={behaviouralGoal}
            onChange={(e) => setBehaviouralGoal(e.target.value)}
            placeholder="Behavioral Goal"
            type="number"
            max={10}
            className="w-full"
          />
        )}

        {jobsEnabled && (
          <Input
            value={jobsGoal}
            onChange={(e) => setJobsGoal(e.target.value)}
            placeholder="Jobs Applied Goal"
            type="number"
            max={10}
            className="w-full"
          />
        )}

        {systemDesignEnabled && (
          <Input
            value={systemDesignGoal}
            onChange={(e) => setSystemDesignGoal(e.target.value)}
            placeholder="System Design Goal"
            type="number"
            max={10}
            className="w-full"
          />
        )}

        <Button type="submit" className="self-start hover:bg-[#2F006B] hover:text-white">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            "Save User Settings"
          )}
        </Button>
      </form>
      <div className="h-full">
        <UploadSection />
      </div>
    </div>
  );
};

export default ProfileForm;
