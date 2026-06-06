import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Name Checked",
  description: "ระบบเช็คชื่อนักเรียนสำหรับครูประจำชั้น",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Name Checked",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
