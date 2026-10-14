// app/api/resi/[id]/route.ts

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Chromium cold-start + page render can exceed the default function timeout.
export const maxDuration = 60

import type { Browser } from "puppeteer-core"
import { Buffer } from "buffer"
import { cookies } from "next/headers"
import { launchBrowser, getBaseUrl } from "@/lib/pdf/browser"

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const { id } = await params

  let browser: Browser | null = null

  try {
    const cookieStore = await cookies()

    browser = await launchBrowser()

    const page = await browser.newPage()

    const baseUrl = getBaseUrl(req)

    // Teruskan SEMUA cookie request (termasuk sesi Supabase) ke Chromium lewat
    // header Cookie — meniru request browser asli. Pakai header `cookie` mentah
    // dari request asli (paling andal: persis yang dikirim browser, termasuk
    // chunked `sb-...-auth-token.0/.1`), fallback ke cookies() bila kosong.
    const rawCookieHeader = req.headers.get("cookie") ?? ""
    const cookieHeader =
      rawCookieHeader ||
      cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ")

    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ Cookie: cookieHeader })
    }

    const target = `${baseUrl}/print/${id}`
    const res = await page.goto(target, {
      waitUntil: "networkidle0",
    })

    // Kalau halaman /print mengembalikan non-200 atau dialihkan ke login
    // (cookie sesi tidak valid), PDF-nya akan berisi halaman yang salah.
    // Surface-kan supaya jelas, bukan "Failed generate PDF" buram.
    const status = res?.status() ?? 0
    if (status >= 400 || status === 0) {
      throw new Error(
        `Gagal memuat halaman resi: ${target} → HTTP ${status}.`
      )
    }
    if (page.url().includes("/auth/login")) {
      const names = cookieHeader
        .split("; ")
        .map((c) => c.split("=")[0])
        .filter(Boolean)
      throw new Error(
        `Tidak terautentikasi (dialihkan ke login). ` +
          `baseUrl=${baseUrl} finalUrl=${page.url()} ` +
          `cookieSource=${rawCookieHeader ? "request" : "cookies()"} ` +
          `cookies=[${names.join(",")}]`
      )
    }

    const pdf = await page.pdf({
      width: "100mm",
      height: "150mm",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      preferCSSPageSize: true,
    })

    return new Response(
      Buffer.from(pdf),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="resi-${id}.pdf"`,
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        error: "Failed generate PDF",
        // Sementara: detail untuk diagnosa di production. Hapus setelah beres.
        detail: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}