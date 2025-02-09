import Tracker from "@/components/icons/tracker";
import Logs from "@/components/icons/automator";
import Templates from "@/components/icons/statistics";
import Home from "@/components/icons/dashboard";
import Payment from "@/components/icons/billing";
import Settings from "@/components/icons/settings";
import Workflows from "@/components/icons/interviews";
import { Feature } from "@/types/header";

export const statuses = ["Nothing Done", "Applying", "Applied", "OA", "Interview", "Offer"];

export const statusColors = [
  "bg-red-500/10 text-red-500",
  "bg-yellow-500/10 text-yellow-500",
  "bg-green-500/10 text-green-500",
  "bg-blue-500/10 text-blue-500",
  "bg-indigo-500/10 text-indigo-500",
  "bg-purple-500/10 text-purple-500",
];

export const features: Feature[] = [
  {
    title: "Moonbeam",
    link: "https://localhost:3000",
    thumbnail: "/p1.png",
  },
  {
    title: "Cursor",
    link: "https://localhost:3000",
    thumbnail: "/p2.png",
  },
  {
    title: "Rogue",
    link: "https://localhost:3000",
    thumbnail: "/p3.png",
  },
  {
    title: "Editorially",
    link: "https://localhost:3000",
    thumbnail: "/p4.png",
  },
  {
    title: "Editrix AI",
    link: "https://localhost:3000",
    thumbnail: "/p5.png",
  },
  {
    title: "Pixel Perfect",
    link: "https://app.localhost:3000",
    thumbnail: "/p6.png",
  },

  {
    title: "Algochurn",
    link: "https://localhost:3000",
    thumbnail: "/p1.png",
  },
  {
    title: "Aceternity UI",
    link: "https://ui.localhost:3000",
    thumbnail: "/p2.png",
  },
  {
    title: "Tailwind Master Kit",
    link: "https://localhost:3000",
    thumbnail: "/p3.png",
  },
  {
    title: "SmartBridge",
    link: "https://localhost:3000",
    thumbnail: "/p4.png",
  },
  {
    title: "Renderwork Studio",
    link: "https://localhost:3000",
    thumbnail: "/p5.png",
  },

  {
    title: "Creme Digital",
    link: "https://localhost:3000",
    thumbnail: "/p6.png",
  },
  {
    title: "Golden Bells Academy",
    link: "https://localhost:3000",
    thumbnail: "/p1.png",
  },
  {
    title: "Invoker Labs",
    link: "https://localhost:3000",
    thumbnail: "/p2.png",
  },
  {
    title: "E Free Invoice",
    link: "https://localhost:3000",
    thumbnail: "/p3.png",
  },
];

export const menuOptionstmp = [
  { name: "Dashboard", Component: Home, href: "/dashboard" },
  { name: "Tracker", Component: Workflows, href: "/tracker" },
  { name: "Resume", Component: Settings, href: "/resume" },
  { name: "Applications", Component: Tracker, href: "/coverletter" },
  { name: "Templates", Component: Templates, href: "/templates" },
  { name: "Mock Interviews", Component: Payment, href: "/mock" },
  { name: "Logs", Component: Logs, href: "/logs" },
  // add settings
];

export const menuOptions = [
  { name: "Dashboard", Component: Home, href: "/dashboard" },
  { name: "Tracker", Component: Tracker, href: "/tracker" },
  { name: "Appliction Automator", Component: Logs, href: "/generate" },
  { name: "Mock Interviews", Component: Workflows, href: "/interview" },
  { name: "Statistics", Component: Templates, href: "/statistics" },
  { name: "Billing", Component: Payment, href: "/billing" },
  { name: "Settings", Component: Settings, href: "/settings" },
];
