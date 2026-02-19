import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = "https://devtools.catiteo.com";
const APP_NAME = "DevToolbox";
const APP_DESCRIPTION =
  "Caixa de ferramentas gratuita para desenvolvedores — Formate JSON, teste Regex, decodifique JWT, gere hashes, converta cores, revise código com IA e muito mais.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Ferramentas para Desenvolvedores`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "ferramentas desenvolvedor", "json formatter", "regex tester",
    "base64 encoder", "jwt decoder", "gerador hash", "conversor de cores",
    "gerador senha", "uuid generator", "diff checker", "markdown preview",
    "sql formatter", "cron parser", "revisão código ia", "devtools",
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Ferramentas para Desenvolvedores`,
    description: APP_DESCRIPTION,
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Ferramentas para Desenvolvedores`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/og-image.png`],
  },
  alternates: { canonical: APP_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Previne flash de tema antes da hidratação do React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('devtoolbox-theme')||'dark';document.documentElement.classList.add(t);}catch(e){}})()`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
