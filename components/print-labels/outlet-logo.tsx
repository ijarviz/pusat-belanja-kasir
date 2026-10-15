/* eslint-disable @next/next/no-img-element */

// Logo outlet di kiri atas label (pengganti logo Autolaris di autolaris-app);
// tanpa logo, nama outlet ditampilkan sebagai teks.
export function OutletLogo({
  src,
  name,
  className = "h-10",
}: {
  src: string | null
  name: string
  className?: string
}) {
  return src ? (
    <img src={src} alt={name} className={`${className} w-auto max-w-[180px] object-contain`} />
  ) : (
    <span className="text-xl font-bold">{name}</span>
  )
}
