// Shared headless-browser launcher for PDF generation (cetak resi).
//
// Works in two environments from one codebase:
//   - Vercel / serverless: uses the Chromium binary bundled by
//     @sparticuz/chromium (the regular `puppeteer` download is far too big
//     for the 250MB function limit and lacks the right shared libraries).
//   - Local dev: uses a locally installed Chrome/Chromium so you don't need
//     the serverless binary on your machine.
//
// puppeteer-core is intentionally used (no bundled browser download).

import type { Browser } from "puppeteer-core"

// Vercel sets VERCEL=1 in every build/runtime. AWS_LAMBDA_* covers the
// underlying Lambda runtime as a fallback signal.
const isServerless =
  !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

// Allow overriding the local Chrome path when auto-detection isn't enough.
// e.g. PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
const localExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH

export async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core")

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default

    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  // Local development. Prefer an explicit path, otherwise let puppeteer-core
  // try to find an installed Chrome.
  let executablePath = localExecutablePath
  if (!executablePath) {
    // puppeteer (full) ships a channel/path resolver; if it's installed we can
    // reuse the Chrome it downloaded into the puppeteer cache.
    try {
      const full = await import("puppeteer")
      executablePath = await full.default.executablePath()
    } catch {
      // puppeteer (full) not installed — fall through and rely on system Chrome.
    }
  }

  return puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
}

// Resolve the base URL that the headless browser should navigate to in order
// to render the printable page. We must NOT hardcode localhost: on Vercel the
// function has to hit its own deployment URL.
//
// Priority:
//   1. NEXT_PUBLIC_APP_URL — explicit override (use a stable production domain).
//   2. The incoming request's own origin — always correct for the current
//      deployment (preview or production), derived from forwarded headers.
//   3. localhost fallback for local dev.
export function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  const headers = req.headers
  const host = headers.get("x-forwarded-host") ?? headers.get("host")
  if (host) {
    const proto = headers.get("x-forwarded-proto") ?? "https"
    return `${proto}://${host}`
  }

  return "http://localhost:3000"
}
