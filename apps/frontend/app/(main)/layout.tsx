"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfile } from "../(auth)/services/api";
import Sidebar from "@/components/ui/sidebar";
import InfoBar from "@/components/ui/infobar";
import LoadingScreen from "@/components/ui/loading-screen";

type Props = { children: React.ReactNode };

export default function MainLayout({ children }: Props) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // run auth check once on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    getProfile()
      .then(() => setCheckingAuth(false))
      .catch(() => {
        localStorage.removeItem("access_token");
        router.replace("/login");
      });
  }, [router]);

  if (checkingAuth) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex overflow-hidden h-screen">
      <Sidebar />
      <div className="w-full">
        <InfoBar />
        {children}
      </div>
    </div>
  );
}
