// Digital Asset Links untuk APK kasir (TWA, ../android/): membuktikan APK
// bertanda tangan keystore ini milik kasir.pusatbelanja.top, sehingga app
// tampil layar penuh tanpa bilah URL Chrome. Fingerprint = SHA-256
// sertifikat keystore rilis (../docs/android-kasir/, di luar repo).
const PACKAGE_NAME = "top.pusatbelanja.kasir"
const SHA256_FINGERPRINTS = [
  "2B:5A:06:A6:C9:86:09:07:8D:49:23:BD:B4:AF:D2:8C:5E:4F:6C:01:52:76:E3:3B:31:DA:DC:A0:22:D5:36:1F",
]

export function GET() {
  return Response.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: SHA256_FINGERPRINTS,
      },
    },
  ])
}
