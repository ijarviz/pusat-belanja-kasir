# APK kasir (TWA)

APK Android untuk `kasir.pusatbelanja.top`, berbentuk **Trusted Web Activity**:
app membuka situs kasir di Chrome tanpa bilah URL. Bukan WebView, karena
WebView Android tidak mendukung WebUSB/Web Bluetooth yang dipakai untuk
mencetak struk (`lib/printer/`). Akibatnya HP harus punya Chrome (versi baru).

- Package: `top.pusatbelanja.kasir`, minSdk 24 (Android 7).
- Konfigurasi: `twa-manifest.json`. Folder lain di sini dibuat ulang oleh
  Bubblewrap (`/opt/bubblewrap`), jangan diedit manual.
- Build: `bash android/build-apk.sh` (naikkan `appVersionCode` dan `appVersion`
  dulu). Hasil: `../docs/android-kasir/kasir-pusatbelanja-<versi>.apk`, dan
  disalin ke `public/download/kasir-pusatbelanja.apk` (tidak di git); redeploy
  kasir supaya file baru ikut dilayani. Unduh dari Pengaturan > Printer > Unduh APK.
- Keystore rilis + password: `../docs/android-kasir/` (di luar repo). Jangan
  hilang: update APK harus ditandatangani keystore yang sama, dan fingerprint
  SHA-256-nya ada di `app/.well-known/assetlinks.json/route.ts`. Kalau
  assetlinks tidak cocok, app tetap jalan tapi menampilkan bilah URL Chrome.
- Log printer dari HP/APK: tabel `printer_logs`, dilihat di
  Pengaturan > Printer > Log Printer (`lib/printer/logger.ts`).
