import imageCompression from "browser-image-compression"

export type ImageType =
  | "banner"
  | "product"
  | "variant"
  | "store"

const configs = {
  banner: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1340,
  },

  product: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
  },

  variant: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 800,
  },

  store: {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 600,
  },
}

// ukuran minimal agar file webp masih layak dikompres
const WEBP_SKIP_SIZE = 300 * 1024 // 300 KB

export async function compressImage(
  file: File,
  type: ImageType = "product"
): Promise<File> {
  const config = configs[type]

  const isWebp = file.type === "image/webp"

  // WebP kecil → jangan dikompres lagi
  if (isWebp && file.size <= WEBP_SKIP_SIZE) {
    return file
  }

  const compressed = await imageCompression(file, {
    ...config,
    fileType: "image/webp",
    useWebWorker: true,

    // kualitas awal lebih aman
    initialQuality: 0.9,

    // cegah resize yang tidak perlu
    alwaysKeepResolution: true,
  })

  // jika hasil kompres malah lebih besar,
  // pakai file asli saja
  if (compressed.size >= file.size) {
    return file
  }

  return new File(
    [compressed],
    `${crypto.randomUUID()}.webp`,
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  )
}