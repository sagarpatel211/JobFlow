import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import AuthProvider from "@/providers/auth-provider";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobFlow",
  description: "A tool to help automate your job search",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={`${dmSans.className} antialiased`}>
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="dark">
          <AuthProvider session={session}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
