import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Portfolio Tracker",
  description: "Shared family portfolio tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
