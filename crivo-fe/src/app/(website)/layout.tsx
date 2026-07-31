import { Space_Grotesk } from "next/font/google";

import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";

// Marketing usa Space Grotesk (mesma escolha do snap-fe); o app segue com Geist.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={spaceGrotesk.className}>
      <Header />
      <main
        className="min-h-screen pt-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(238, 242, 255, 0.9) 0%, #fff 65%)",
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
