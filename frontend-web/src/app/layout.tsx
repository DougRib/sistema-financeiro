import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { PrivacyProvider } from "@/components/ui/PrivacyContext";
import { ApiClientSetup } from "@/components/ApiClientSetup";

export const runtime = "nodejs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fincontrol.com.br"),

  title: {
    default: "FinControl - Sistema Financeiro",
    template: "%s | FinControl",
  },

  description:
    "Sistema financeiro completo para controle de receitas, despesas, fluxo de caixa, estoque, vendas, PDV e relatórios.",

  keywords: [
    "controle financeiro",
    "gestão financeira",
    "fluxo de caixa",
    "controle de despesas",
    "controle de receitas",
    "dashboard financeiro",
    "ERP financeiro",
    "PDV",
    "controle de estoque",
    "sistema financeiro",
    "finanças pessoais",
    "finanças empresariais",
  ],

  authors: [
    {
      name: "FinControl",
    },
  ],
  creator: "FinControl",
  publisher: "FinControl",
  applicationName: "FinControl",
  category: "Finance",
  robots: {
    index: true,
    follow: true,
    nocache: false,

    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      {
        url: "/fc-icon.png",
      },
      {
        url: "/fc-icon.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],

    shortcut: "/fc-icon.png",
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
  },

  manifest: "/manifest.json",
  openGraph: {
    title: "FinControl",
    description:
      "Sistema financeiro moderno para gestão de receitas, despesas, estoque, vendas e fluxo de caixa.",
    url: "https://fincontrol.com.br",
    siteName: "FinControl - Sistema Financeiro",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/fc-icon.png",
        width: 1200,
        height: 630,
        alt: "FinControl - Sistema Financeiro",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinControl - Sistema Financeiro",
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#07111F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ApiClientSetup />
        <PrivacyProvider>
          <ToastProvider>{children}</ToastProvider>
        </PrivacyProvider>
      </body>
    </html>
  );
}
