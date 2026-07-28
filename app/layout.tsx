import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeBloom — Find your typing rhythm",
  description:
    "A bright, focused typing test with three difficulty levels, flexible timers, fresh samples, and clear speed and accuracy results.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "TypeBloom — Find your rhythm",
    description:
      "Build typing speed without losing precision. Choose your pace and start typing.",
    images: [{ url: "/og-v2.png", width: 1200, height: 630, alt: "TypeBloom typing practice" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TypeBloom — Find your rhythm",
    description: "Bright, focused typing practice with instant results.",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
