import "./globals.css";

export const metadata = {
  title: "Portal Institucional Educativo",
  description: "Sistema de Gestión y Servicios Educativos",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PORTAL ESCOLAR - VIRGILIO CARLOS FERREYRA",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}