"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function SignInButton() {
  return (
    <Button variant="ghost" onClick={() => void signIn()}>
      Sign In
    </Button>
  );
}

export function SignOutButton() {
  return (
    <DropdownMenuItem onClick={() => void signOut()}>
      <LogOut className="w-5 h-5 mr-2" />
      Log Out
    </DropdownMenuItem>
  );
}
