"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { menuOptions } from "@/lib/constants";
import clsx from "clsx";
import { Separator } from "@/components/ui/separator";
import { Database, GitBranch, LucideMousePointerClick } from "lucide-react";
import { ModeToggle } from "@/components/global/mode-toggle";

const MenuOptions = () => {
  const pathName = usePathname();

  return (
    <nav className=" dark:bg-black h-screen overflow-scroll  justify-between flex items-center flex-col gap-10 py-6 px-2">
      <div className="flex items-center justify-center flex-col gap-8">
        <div className="flex font-bold flex-row pl-1"></div>
        <TooltipProvider>
          {menuOptions.map((menuItem) => (
            <ul key={menuItem.name}>
              <li>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger>
                    <Link
                      href={menuItem.href}
                      className={clsx(
                        "group h-8 w-8 flex items-center justify-center  scale-[1.5] rounded-lg p-[3px]  cursor-pointer",
                        {
                          "dark:bg-[#2F006B] bg-[#EEE0FF] ": pathName === menuItem.href,
                        },
                      )}
                    >
                      <menuItem.Component selected={pathName === menuItem.href} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-black/10 backdrop-blur-xl">
                    <p>{menuItem.name}</p>
                  </TooltipContent>
                </Tooltip>
              </li>
            </ul>
          ))}
        </TooltipProvider>
        <Separator />
        <div className="flex items-center flex-col gap-9 dark:bg-[#353346]/30 py-4 px-2 rounded-full h-56 overflow-scroll border-[1px]">
          <div className="relative">
            <svg className="absolute top-0 left-0 w-full h-full z-50" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(165, 80%, 40%)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="100 200"
                strokeDashoffset="0"
                className="origin-center animate-[spin_2s_linear_infinite]"
              />
            </svg>
            <div className="relative dark:bg-[#353346]/70 p-2 rounded-full dark:border-t-[2px] border-[1px] dark:border-t-[#353346] w-full h-full flex items-center justify-center">
              <LucideMousePointerClick className="dark:text-white" size={18} />
            </div>
            <div className="border-l-2 border-muted-foreground/50 h-6 absolute left-1/2 -translate-x-1/2 -bottom-[30px]" />
          </div>
          <div className="relative dark:bg-[#353346]/70 p-2 rounded-full dark:border-t-[2px] border-[1px] dark:border-t-[#353346]">
            <GitBranch className="text-muted-foreground" size={18} />
            <div className="border-l-2 border-muted-foreground/50 h-6 absolute left-1/2 transform translate-x-[-50%] -bottom-[30px]"></div>
          </div>
          <div className="relative dark:bg-[#353346]/70 p-2 rounded-full dark:border-t-[2px] border-[1px] dark:border-t-[#353346]">
            <Database className="text-muted-foreground" size={18} />
            <div className="border-l-2 border-muted-foreground/50 h-6 absolute left-1/2 transform translate-x-[-50%] -bottom-[30px]"></div>
          </div>
          <div className="relative dark:bg-[#353346]/70 p-2 rounded-full dark:border-t-[2px] border-[1px] dark:border-t-[#353346]">
            <GitBranch className="text-muted-foreground" size={18} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center flex-col gap-8">
        <ModeToggle />
      </div>
    </nav>
  );
};

export default MenuOptions;
