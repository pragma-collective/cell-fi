// import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato_sans = Lato({
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

// export const metadata: Metadata = {
//   title: "Cell-Fi",
//   description: "Your Financial Bridge, Always Connected.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`text-[16px] h-full font-light bg-[var(--color-dark-purple)] text-white ${lato_sans.className}`}>
        {children}
      </body>
    </html>
  );
}
