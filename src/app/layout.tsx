import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "QRdose — Medication Management, Simplified.",
  description:
    "QRdose notifies up to 10 contacts all at once, with a single tap or scan. No app, no fuss. Get reminded by text and email if a dose is missed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
