"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { UploadSection } from "./upload-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfile, updateProfile } from "@/app/(auth)/services/api";

const ProfileForm = () => {
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [university, setUniversity] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [openAIKey, setOpenAIKey] = useState("");

  // Removed leetcode account input; only goal is needed.
  const [leetcodeEnabled, setLeetcodeEnabled] = useState(false);
  const [leetcodeGoal, setLeetcodeGoal] = useState("");

  const [behaviouralEnabled, setBehaviouralEnabled] = useState(false);
  const [behaviouralGoal, setBehaviouralGoal] = useState("");

  const [jobsEnabled, setJobsEnabled] = useState(false);
  const [jobsGoal, setJobsGoal] = useState("");

  const [systemDesignEnabled, setSystemDesignEnabled] = useState(false);
  const [systemDesignGoal, setSystemDesignGoal] = useState("");

  const [archiveDuration, setArchiveDuration] = useState("A Month");
  const [deleteDuration, setDeleteDuration] = useState("A Month");
  const [isLoading, setIsLoading] = useState(false);

  // Load existing settings and tracking preferences
  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getProfile();
        setEmail(profile.email);
        setPhoneNumber(profile.phoneNumber || "");
        setAddress(profile.address || "");
        setUniversity(profile.university || "");
        setAboutMe(profile.aboutMe || "");
        setOpenAIKey(profile.openAIKey || "");
        setArchiveDuration(profile.archiveDuration);
        setDeleteDuration(profile.deleteDuration);
        setLeetcodeEnabled(profile.leetcodeEnabled);
        setLeetcodeGoal(profile.leetcodeGoal.toString());
        setBehaviouralEnabled(profile.behaviouralEnabled);
        setBehaviouralGoal(profile.behaviouralGoal.toString());
        setJobsEnabled(profile.jobsEnabled);
        setJobsGoal(profile.jobsGoal.toString());
        setSystemDesignEnabled(profile.systemDesignEnabled);
        setSystemDesignGoal(profile.systemDesignGoal.toString());
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };
    void load();
  }, []);

  // Validation: All required fields (and checkbox goal fields when enabled) must be non-empty.
  const isFormValid =
    email.trim() !== "" &&
    address.trim() !== "" &&
    university.trim() !== "" &&
    aboutMe.trim() !== "" &&
    phoneNumber.trim() !== "" &&
    openAIKey.trim() !== "" &&
    (!leetcodeEnabled || leetcodeGoal.trim() !== "") &&
    (!behaviouralEnabled || behaviouralGoal.trim() !== "") &&
    (!jobsEnabled || jobsGoal.trim() !== "") &&
    (!systemDesignEnabled || systemDesignGoal.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please fill out all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile({
        email,
        phoneNumber,
        address,
        university,
        aboutMe,
        openAIKey,
        archiveDuration,
        deleteDuration,
        leetcodeEnabled,
        leetcodeGoal: Number(leetcodeGoal),
        behaviouralEnabled,
        behaviouralGoal: Number(behaviouralGoal),
        jobsEnabled,
        jobsGoal: Number(jobsGoal),
        systemDesignEnabled,
        systemDesignGoal: Number(systemDesignGoal),
      });
      toast.dismiss(); // Dismiss any existing toasts
      toast.success("Settings saved successfully.", {
        position: "top-center",
        style: { background: "#1f2937", color: "#fff" },
      });
      // Refresh the page to reflect updated settings and remain on this page
      window.location.reload();
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8 items-start">
      <form
        className="grid grid-cols-1 gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(e);
        }}
      >
        {/* Inline Email and Phone Number */}
        <div className="grid grid-cols-2 gap-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone Number" type="tel" />
        </div>

        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
        <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University" />
        <Textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} placeholder="About Me" />
        {/* New field for OpenAI API Key */}
        <Input value={openAIKey} onChange={(e) => setOpenAIKey(e.target.value)} placeholder="OpenAI API Key" />

        {/* Archive and Delete Dropdowns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Automatically Archive Unapplied Jobs</label>
            <Select value={archiveDuration} onValueChange={(value) => setArchiveDuration(value)}>
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
          <div>
            <label className="block text-sm font-medium">Automatically Delete Unapplied Jobs</label>
            <Select value={deleteDuration} onValueChange={(value) => setDeleteDuration(value)}>
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
        </div>

        {/* 2x2 Grid for Checkbox Items with Column-Aligned Goal Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="leetcode"
                checked={leetcodeEnabled}
                onCheckedChange={(checked) => setLeetcodeEnabled(Boolean(checked))}
              />
              <label htmlFor="leetcode">Track LeetCode</label>
            </div>
            {leetcodeEnabled && (
              <Input
                type="number"
                value={leetcodeGoal}
                onChange={(e) => setLeetcodeGoal(e.target.value)}
                placeholder="Goal"
                className="w-full mt-1"
              />
            )}
          </div>
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="behavioural"
                checked={behaviouralEnabled}
                onCheckedChange={(checked) => setBehaviouralEnabled(Boolean(checked))}
              />
              <label htmlFor="behavioural">Track Behavioral</label>
            </div>
            {behaviouralEnabled && (
              <Input
                type="number"
                value={behaviouralGoal}
                onChange={(e) => setBehaviouralGoal(e.target.value)}
                placeholder="Goal"
                className="w-full mt-1"
              />
            )}
          </div>
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="jobs" checked={jobsEnabled} onCheckedChange={(checked) => setJobsEnabled(Boolean(checked))} />
              <label htmlFor="jobs">Track Jobs Applied</label>
            </div>
            {jobsEnabled && (
              <Input
                type="number"
                value={jobsGoal}
                onChange={(e) => setJobsGoal(e.target.value)}
                placeholder="Goal"
                className="w-full mt-1"
              />
            )}
          </div>
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="systemDesign"
                checked={systemDesignEnabled}
                onCheckedChange={(checked) => setSystemDesignEnabled(Boolean(checked))}
              />
              <label htmlFor="systemDesign">Track System Design</label>
            </div>
            {systemDesignEnabled && (
              <Input
                type="number"
                value={systemDesignGoal}
                onChange={(e) => setSystemDesignGoal(e.target.value)}
                placeholder="Goal"
                className="w-full mt-1"
              />
            )}
          </div>
        </div>

        <Button type="submit" className="self-start hover:bg-[#2F006B] hover:text-white" disabled={!isFormValid || isLoading}>
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
