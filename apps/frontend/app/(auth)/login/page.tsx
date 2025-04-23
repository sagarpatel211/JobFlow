"use client";
import React, { useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { toast, Toaster } from "react-hot-toast";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useRouter } from "next/navigation";
import { login, getProfile } from "../services/api";

export default function LoginPage() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await login(email, password);
      localStorage.setItem("access_token", access_token);
      document.cookie = `access_token=${access_token}; Path=/; Max-Age=${String(60 * 60 * 24 * 30)}`;
      toast.success("Logged in successfully!");
      const profile = await getProfile();
      if (!profile.is_onboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

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
      <AuroraBackground className="absolute inset-0 -z-10" />
      <div className="relative z-50 h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
          <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">Login to Your Account</h2>
          <form className="my-8" onSubmit={(e) => void handleSubmit(e)}>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </LabelInputContainer>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </LabelInputContainer>
            <button
              className={cn(
                "relative group/btn w-full rounded-md h-10 font-medium flex justify-center items-center text-white",
                isDark
                  ? "bg-gradient-to-br from-zinc-900 to-zinc-900 dark:bg-zinc-800"
                  : "bg-gradient-to-br from-blue-500 to-blue-600",
              )}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>Login &rarr;</>
              )}
              <BottomGradient />
            </button>

            <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

            <div className="flex flex-col space-y-4">
              <button
                className="relative group/btn flex space-x-2 items-center justify-start px-4 w-full rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)] text-black dark:text-white"
                type="button"
                disabled={loading}
              >
                <IconBrandGithub className="h-4 w-4" />
                <span className="text-sm">GitHub</span>
                <BottomGradient />
              </button>
              <button
                className="relative group/btn flex space-x-2 items-center justify-start px-4 w-full rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)] text-black dark:text-white"
                type="button"
                disabled={loading}
              >
                <IconBrandGoogle className="h-4 w-4" />
                <span className="text-sm">Google</span>
                <BottomGradient />
              </button>
            </div>
          </form>
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("flex flex-col space-y-2 w-full", className)}>{children}</div>;
};
