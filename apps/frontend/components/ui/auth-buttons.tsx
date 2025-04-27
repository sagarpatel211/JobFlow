"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function SignInButton() {
  const router = useRouter();
  return (
    <Button variant="ghost" onClick={() => router.push("/login")}>
      Sign In
    </Button>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <DropdownMenuItem
      onClick={() => {
        // clear JWT and redirect to login
        localStorage.removeItem("access_token");
        document.cookie = "access_token=; Path=/; Max-Age=0";
        router.replace("/login");
      }}
    >
      <LogOut className="w-5 h-5 mr-2" />
      Log Out
    </DropdownMenuItem>
  );
}
