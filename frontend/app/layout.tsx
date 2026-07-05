import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduCore — Education Management System",
  description: "Modern education management platform for schools and learning centers",
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
