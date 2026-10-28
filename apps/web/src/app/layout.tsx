import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { SesionProvider } from "@/hooks/use-sesion";
import { MarcoApp } from "@/components/shell/marco-app";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { DESCRIPCION_SITIO, PLANTILLA_TITULO, TITULO_BASE } from "@/lib/titulos";

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
  title: { default: TITULO_BASE, template: PLANTILLA_TITULO },
  description: DESCRIPCION_SITIO,
  openGraph: {
    title: TITULO_BASE,
    description: DESCRIPCION_SITIO,
    type: "website",
    locale: "es_ES",
    siteName: TITULO_BASE,
  },
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
          <SesionProvider>
            <MarcoApp>{children}</MarcoApp>
          </SesionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
