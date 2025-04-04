"use client";

import React from "react";
import ProfileForm from "@/app/(main)/(pages)/settings/components/profile-form";
import { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";

const SettingsPage = () => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <div className="flex flex-col gap-4 min-h-screen">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
          <span>Settings</span>
        </h1>
        <div className="flex flex-col gap-10 p-6">
          <div>
            <h2 className="text-2xl font-bold">User Profile</h2>
            <p className="text-base text-white/50">Add or update your information</p>
          </div>
          <ProfileForm />
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: resolvedTheme === "dark" ? "#333" : "#fff",
            color: resolvedTheme === "dark" ? "#fff" : "#000",
          },
          success: {
            style: {
              background: resolvedTheme === "dark" ? "#4CAF50" : "#00C851",
              color: "#fff",
            },
          },
          error: {
            style: {
              background: resolvedTheme === "dark" ? "#D32F2F" : "#ff4444",
              color: "#fff",
            },
          },
        }}
      />
    </>
  );
};

export default SettingsPage;
