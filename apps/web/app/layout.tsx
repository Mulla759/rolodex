import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/components/nav/AppNav";

export const metadata: Metadata = {
  title: "Rolodex",
  description: "Recruiter discovery for CS students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-page font-sans antialiased bg-[linear-gradient(to_right,var(--color-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-grid)_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 sm:px-12 py-10">{children}</main>
      </body>
    </html>
  );
}
