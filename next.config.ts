import type { NextConfig } from "next";

// Gambar produk diunggah lewat panel dan disajikan dari
// UPLOAD_PUBLIC_URL panel. Kalau URL-nya absolut, host-nya harus
// diizinkan untuk next/image.
const uploadUrl = (() => {
  try {
    return new URL(process.env.UPLOAD_PUBLIC_URL ?? "");
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
  ],
  // Keep the Chromium binary out of Next's bundler so @sparticuz/chromium can
  // locate its packaged executable at runtime on Vercel.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // serverExternalPackages saja TIDAK cukup di Vercel: file binary di
  // @sparticuz/chromium/bin (chromium.br dll) tidak ikut ter-trace ke output
  // serverless, sehingga runtime error "input directory .../bin does not exist".
  // Paksa Next menyertakan folder bin itu untuk kedua route cetak resi.
  outputFileTracingIncludes: {
    "/print/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/print/bulk/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  images: {
    remotePatterns: [
      // URL gambar lama dari Supabase Storage (data hasil impor).
      {
        protocol: "https",
        hostname: "pxjztfezqoiacyyezete.supabase.co"
        // hostname: "**",
      },
      ...(uploadUrl
        ? [
            {
              protocol: uploadUrl.protocol.replace(":", "") as "http" | "https",
              hostname: uploadUrl.hostname,
              port: uploadUrl.port,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
