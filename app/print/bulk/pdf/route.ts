export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Chromium cold-start + multi-page render can exceed the default timeout.
export const maxDuration = 60

import type { Browser } from "puppeteer-core"

import { Buffer } from "buffer"
import { cookies } from "next/headers"
import { launchBrowser, getBaseUrl } from "@/lib/pdf/browser"

export async function GET(
  req: Request
) {
  let browser: Browser | null = null

  try {
    const cookieStore =
      await cookies()

    const { searchParams } =
      new URL(req.url)

    const ids =
      searchParams.get("ids")

    if (!ids) {
      return Response.json(
        {
          error: "No ids provided",
        },
        {
          status: 400,
        }
      )
    }

    browser = await launchBrowser()

    const page =
      await browser.newPage()

    const baseUrl = getBaseUrl(req)

    // Teruskan SEMUA cookie request (termasuk sesi Supabase) ke Chromium lewat
    // header Cookie. Pakai header `cookie` mentah dari request asli (paling
    // andal), fallback ke cookies() bila kosong.
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

    const target = `${baseUrl}/print/bulk?ids=${ids}`
    const res = await page.goto(target, {
      waitUntil: "networkidle0",
    })

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

    const pdf =
      await page.pdf({
        width: "100mm",
        height: "150mm",
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      })

    return new Response(
      Buffer.from(pdf),
      {
        headers: {
          "Content-Type":
            "application/pdf",
          "Content-Disposition":
            'inline; filename="bulk-resi.pdf"',
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