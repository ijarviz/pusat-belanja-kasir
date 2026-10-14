import { readFile } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

/*
 * Menyajikan gambar upload panel (produk, banner, logo outlet, logo
 * kurir) dari disk yang sama dengan panel, supaya URL relatif
 * "/uploads/..." di database juga tampil di kasir. Salinan
 * app/uploads milik store.
 */
const BUCKETS = ["products", "banners", "outlets", "expeditions"]

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bucket: string; file: string }> }
) {
  const { bucket, file } = await params

  const match = /^[A-Za-z0-9-]+\.([a-z]+)$/.exec(file)
  const contentType = match
    ? CONTENT_TYPE_BY_EXTENSION[match[1]]
    : undefined

  if (!BUCKETS.includes(bucket) || !contentType) {
    return new Response("Not found", { status: 404 })
  }

  const uploadDir =
    process.env.UPLOAD_DIR ?? "/autolaris/websites/pusatbelanja/uploads"

  try {
    const data = await readFile(path.join(uploadDir, bucket, file))

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
