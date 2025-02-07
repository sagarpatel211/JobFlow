import Category from "@/components/icons/category";
import Logs from "@/components/icons/clipboard";
import Templates from "@/components/icons/cloud";
import Home from "@/components/icons/home";
import Payment from "@/components/icons/payment";
import Settings from "@/components/icons/settings";
import Workflows from "@/components/icons/workflows";

interface HeaderProps {
  title: string;
  link: string;
  thumbnail: string;
}

export const features: HeaderProps[] = [
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

export const menuOptions = [
  { name: "Dashboard", Component: Home, href: "/dashboard" },
  { name: "Workflows", Component: Workflows, href: "/workflows" },
  { name: "Settings", Component: Settings, href: "/settings" },
  { name: "Connections", Component: Category, href: "/connections" },
  { name: "Billing", Component: Payment, href: "/billing" },
  { name: "Templates", Component: Templates, href: "/templates" },
  { name: "Logs", Component: Logs, href: "/logs" },
];
