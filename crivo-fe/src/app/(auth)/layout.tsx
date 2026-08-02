import { MuiProvider } from "@/components/providers/mui-provider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MuiProvider>{children}</MuiProvider>;
}
