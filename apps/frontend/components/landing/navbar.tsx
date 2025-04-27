"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SignInButton, SignOutButton } from "@/components/ui/auth-buttons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setAuthenticated(!!token);
  }, []);

  return (
    <header className="fixed right-0 left-0 top-0 py-4 px-4 bg-black/40 backdrop-blur-lg z-[100] flex items-center justify-between border-b-[1px] border-neutral-300 dark:border-neutral-900">
      <aside className="flex items-center gap-[2px]">
        <p className="text-3xl font-bold">JobFlow</p>
      </aside>
      <nav className="absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%] hidden md:block">
        <ul className="flex items-center gap-4 md:gap-5 lg:gap-24 list-none">
          <li className="shimmer-text">
            <Link href="#products" scroll={true}>
              Products
            </Link>
          </li>
          <li className="shimmer-text">
            <Link href="#features" scroll={true}>
              Features
            </Link>
          </li>
          <li className="shimmer-text">
            <Link href="#pricing" scroll={true}>
              Pricing
            </Link>
          </li>
        </ul>
      </nav>
      <aside className="flex items-center gap-4">
        <Link
          href={authenticated ? "/dashboard" : "/api/auth/signup"}
          className="group relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] group-hover:animate-[spin_2s_linear_reverse_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] group-hover:bg-[conic-gradient(from_90deg_at_50%_50%,#D2BBFF_0%,#2A2D9B_50%,#D2BBFF_100%)] transition-[background] duration-3000 ease-in-out" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            {authenticated ? "Dashboard" : "Get Started"}
          </span>
        </Link>
        {authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={localStorage.getItem("user_image") ?? undefined} alt="User" />
                  <AvatarFallback>{localStorage.getItem("user_name")?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[4rem]" align="end" forceMount>
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SignInButton />
        )}
      </aside>
    </header>
  );
};

export default Navbar;
