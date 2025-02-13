"use client";

import React, { useState } from "react";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { Button } from "../../../../../components/ui/button";
import { Switch } from "../../../../../components/ui/switch";
import { Loader2 } from "lucide-react";
import { Card } from "../../../../../components/ui/card";
import { UploadSection } from "./upload-section";
import { motion } from "framer-motion";

const ProfileForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [university, setUniversity] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [leetcodeEnabled, setLeetcodeEnabled] = useState(false);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [behaviouralEnabled, setBehaviouralEnabled] = useState(false);
  const [jobsEnabled, setJobsEnabled] = useState(false);
  const [systemDesignEnabled, setSystemDesignEnabled] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [resume, setResume] = useState(null);
  const [transcript, setTranscript] = useState(null);

  const ToggleSwitch = ({ checked, onCheckedChange }) => {
    return (
      <motion.div
        className={`w-full h-10 flex items-center px-1 rounded-lg cursor-pointer ${checked ? "bg-[#2F006B]" : "bg-gray-300"}`}
        onClick={() => onCheckedChange(!checked)}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25, duration: 3 }}
      >
        <motion.div
          className="h-8 w-10 bg-white rounded-md shadow-md"
          layout
          transition={{ type: "spring", stiffness: 150, damping: 25, duration: 0.5 }}
          style={{ marginLeft: checked ? "calc(100% - 40px)" : "0px" }}
        />
      </motion.div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="grid grid-cols-2 gap-8">
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
        <div className="grid grid-cols-4 gap-4 w-full">
          <div className="flex flex-col items-center w-full">
            <span>Track LeetCode</span>
            <ToggleSwitch checked={leetcodeEnabled} onCheckedChange={setLeetcodeEnabled} />
          </div>
          <div className="flex flex-col items-center w-full">
            <span>Track Behavioral</span>
            <ToggleSwitch checked={behaviouralEnabled} onCheckedChange={setBehaviouralEnabled} />
          </div>
          <div className="flex flex-col items-center w-full">
            <span>Track Jobs Applied</span>
            <ToggleSwitch checked={jobsEnabled} onCheckedChange={setJobsEnabled} />
          </div>
          <div className="flex flex-col items-center w-full">
            <span>Track System Design</span>
            <ToggleSwitch checked={systemDesignEnabled} onCheckedChange={setSystemDesignEnabled} />
          </div>
        </div>
        {leetcodeEnabled && (
          <Input
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            placeholder="LeetCode Username"
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
      <UploadSection />
    </div>
  );
};

export default ProfileForm;
