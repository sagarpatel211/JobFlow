"use client";
import React, { useState, useEffect } from "react";
import SignIn from "@/components/auth/signin";
import Home from "@/components/home/home";
import { Toaster, toast } from "react-hot-toast";
import useAuth from "@/lib/useauth";

export default function App() {
  const { authToken, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);

  useEffect(() => {
    setIsAuthenticated(!!authToken);
  }, [authToken]);

  const handleLogout = () => {
    chrome.storage.sync.remove("authToken", () => {
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    });
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    toast.success("Logged in successfully");
  };

  if (loading) {
    return <div className="w-[400px] h-[500px] bg-black"></div>;
  } else {
    return (
      <>
        {!isAuthenticated ? <SignIn onLogin={handleLogin} /> : <Home onLogout={handleLogout} />}
        <Toaster
          position="top-center"
          toastOptions={{ style: { background: "#1f2937", color: "#fff" } }}
        />
      </>
    );
  }
}
