import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { NavPanel } from "@/components/shell/nav-panel";
import { ThemeProvider } from "@/components/shell/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deploya",
  description: "PaaS de alojamiento: de un repositorio a un servicio en línea con HTTPS.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full font-sans`}
      >
        <ThemeProvider>
          <AppShell nav={<NavPanel />}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
