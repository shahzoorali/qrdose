import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QRdose — Tap to notify the people who care",
  description:
    "One tap or scan sends an instant text to up to 10 contacts. No app required. Perfect for medication and daily check-in alerts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
