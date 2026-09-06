import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "商品マスタ管理",
  description: "商品マスタ管理(SoR)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">{children}</body>
    </html>
  );
}
