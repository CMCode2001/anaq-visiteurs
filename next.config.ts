import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permet de lancer un build de production sans interrompre un serveur de
  // développement déjà actif : NEXT_BUILD_DIR=.next-build npm run build
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Le build Vercel ne doit pas échouer sur une règle de style.
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
