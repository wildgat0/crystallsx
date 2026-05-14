import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import { Pinyon_Script, Cormorant_Garamond, DM_Sans } from "next/font/google";

const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pinyon",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Crystallsx — Moda de Lujo", template: "%s | Crystallsx" },
  description: "Moda de vanguardia seleccionada con cuidado. Pieza a pieza, look a look.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${pinyonScript.variable} ${cormorant.variable} ${dmSans.variable}`}
    >
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1A1814",
                color: "#F7F2EA",
                fontSize: "0.84rem",
                borderRadius: "4px",
                letterSpacing: "0.03em",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
