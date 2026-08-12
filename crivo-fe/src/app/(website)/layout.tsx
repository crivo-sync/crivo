import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { PublicQueryProvider } from "@/components/providers/public-query-provider";

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // A fonte (Space Grotesk) vem do layout raiz via `--font-sans`, a mesma
    // que o admin consome pelo theme do MUI.
    <PublicQueryProvider>
      <div>
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
    </PublicQueryProvider>
  );
}
