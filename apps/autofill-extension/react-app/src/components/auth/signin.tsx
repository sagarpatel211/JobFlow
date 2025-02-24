import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { toast } from "react-hot-toast";
import LabelInputContainer from "@/components/ui/container";
import useAuth from "@/lib/useauth";

const inputClasses =
  "bg-gray-900 text-white border border-gray-700 focus:ring focus:ring-blue-500 px-3 py-2 w-full";

interface SignInProps {
  onLogin: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [spinloading, setspinLoading] = useState(false);
  const { loading } = useAuth();

  const handleGithubSignIn = () => {
    window.open("https://auth-service.com/auth/github", "_blank");
  };

  const handleGoogleSignIn = () => {
    window.open("https://auth-service.com/auth/google", "_blank");
  };

  const handleSignIn = () => {
    chrome.runtime.sendMessage({ action: "authenticate" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError.message);
        toast.error("Failed to communicate with authentication service.");
        return;
      }
      if (!response) {
        toast.error("No response from authentication service.");
        return;
      }
      if (response.success && response.token) {
        chrome.storage.sync.set({ authToken: response.token }, () => {
          onLogin();
        });
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setspinLoading(true);
    const loadingToastId = toast.loading("Signing in...");
    setTimeout(() => {
      setspinLoading(false);
      toast.dismiss(loadingToastId);
      handleSignIn();
    });
  };

  if (loading) {
    return <div className="w-[400px] h-[500px] bg-black"></div>;
  }
  return (
    <div className="w-[400px] h-[500px] mx-auto p-6 shadow-lg bg-black text-white font-sans">
      <h2 className="font-bold text-xl text-neutral-200 text-center">JobFlow - Fill With AI</h2>
      <p className="text-neutral-400 text-sm text-center max-w-sm mt-2">
        Login with JobFlow account to automate applications.
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
            placeholder="•••••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClasses}
          />
        </LabelInputContainer>

        <button
          className="relative flex items-center justify-center bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 w-full text-white rounded-md h-12 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={spinloading}
        >
          {spinloading ? (
            <span className="inline-block animate-spin">
              <svg
                className="w-5 h-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            </span>
          ) : (
            "Sign In"
          )}
        </button>

        <div className="bg-gray-600 my-4 h-px w-full" />

        <div className="flex flex-col space-y-4">
          <button
            onClick={handleGithubSignIn}
            className="flex items-center justify-center px-4 w-full text-white rounded-md h-12 font-medium bg-gray-900 hover:bg-gray-800 transition-all duration-300"
            type="button"
          >
            <span className="inline-block transform transition-transform duration-150 hover:scale-110">
              <IconBrandGithub className="h-5 w-5 mr-2 text-white" />
            </span>
            Sign in with GitHub
          </button>

          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center px-4 w-full text-white rounded-md h-12 font-medium bg-red-800 hover:bg-red-700 transition-all duration-300"
            type="button"
          >
            <span className="inline-block transform transition-transform duration-150 hover:scale-110">
              <IconBrandGoogle className="h-5 w-5 mr-2 text-white" />
            </span>
            Sign in with Google
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
