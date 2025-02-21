"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Toaster, toast } from "react-hot-toast";

const FAKE_AUTH_SUCCESS = true;
const inputClasses =
  "bg-gray-900 text-white border border-gray-700 focus:ring focus:ring-blue-500 px-3 py-2 w-full";

const toasterProps = {
  position: "top-center" as const,
  toastOptions: {
    style: {
      background: "#1f2937",
      color: "#fff",
    },
  },
};

export default function Popup() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const job = { link: "https://example.com/job" };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (FAKE_AUTH_SUCCESS) {
      toast.success("Signed in successfully!");
      setLoggedIn(true);
    } else {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    toast.success("Logged out successfully");
  };

  const handleFillWithAI = (jobLink: string) => {
    toast.success("AI has filled out the application!");
    window.open(jobLink, "_blank");
  };

  if (loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center w-[400px] mx-auto p-6 shadow-lg bg-black text-white min-h-[200px]">
        <h2 className="font-bold text-xl text-neutral-200 text-center mb-6">Welcome User</h2>

        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex h-12 w-full overflow-hidden rounded-md p-[2px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
          onClick={(e) => {
            e.preventDefault();
            handleFillWithAI(job.link);
          }}
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] group-hover:animate-[spin_2s_linear_reverse_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#B0D0FF_0%,#1E3A8A_50%,#B0D0FF_100%)] group-hover:bg-[conic-gradient(from_90deg_at_50%_50%,#A0C4FF_0%,#162D70_50%,#A0C4FF_100%)] transition-[background] duration-3000 ease-in-out" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-md bg-gray-800 dark:bg-zinc-900 px-6 py-2 text-lg font-medium text-white backdrop-blur-3xl">
            Fill with AI
          </span>
        </a>

        <button
          onClick={handleLogout}
          className="mt-6 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-900 w-full text-white rounded-md h-12 font-medium"
        >
          Logout
        </button>

        <Toaster {...toasterProps} />
      </div>
    );
  }

  return (
    <div className="w-[400px] mx-auto p-6 shadow-lg bg-black text-white min-h-[450px]">
      <h2 className="font-bold text-xl text-neutral-200 text-center">JobFlow - Fill With AI</h2>
      <p className="text-neutral-400 text-sm text-center max-w-sm mt-2">
        Login to save time on your job applications.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email" className="text-white">
            Email Address
          </Label>
          <Input
            id="email"
            placeholder="you@example.com"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password" className="text-white">
            Password
          </Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClasses}
          />
        </LabelInputContainer>

        <button
          className="bg-gray-800 hover:bg-gray-700 w-full text-white rounded-md h-12 font-medium"
          type="submit"
        >
          Sign In
        </button>

        <div className="bg-gray-600 my-4 h-px w-full" />

        <div className="flex flex-col space-y-4">
          <button
            className="flex items-center justify-center px-4 w-full text-white rounded-md h-12 font-medium bg-gray-700 hover:bg-gray-600"
            type="button"
          >
            <IconBrandGithub className="h-5 w-5 mr-2 text-white" />
            Sign in with GitHub
          </button>
          <button
            className="flex items-center justify-center px-4 w-full text-white rounded-md h-12 font-medium bg-gray-700 hover:bg-gray-600"
            type="button"
          >
            <IconBrandGoogle className="h-5 w-5 mr-2 text-white" />
            Sign in with Google
          </button>
        </div>
      </form>

      <Toaster {...toasterProps} />
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("flex flex-col space-y-2 w-full", className)}>{children}</div>;
};
