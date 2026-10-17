#!/bin/bash
# Build APK kasir (TWA) dari twa-manifest.json.
#   bash android/build-apk.sh
# Naikkan appVersionCode/appVersion di twa-manifest.json sebelum build rilis
# baru. Keystore + password ada di ../../docs/android-kasir/ (di luar repo;
# tanpa keystore yang sama, APK baru tidak bisa meng-update yang terpasang
# dan assetlinks.json harus diganti).
set -euo pipefail
cd "$(dirname "$0")"

KEYS=/autolaris/websites/pusatbelanja/docs/android-kasir
BT=/opt/android-sdk/build-tools/35.0.0
export JAVA_HOME=/opt/jdk17 ANDROID_HOME=/opt/android-sdk PATH=/opt/node20/bin:/opt/jdk17/bin:$PATH

set -a; . "$KEYS/keystore.env"; set +a

# Regenerasi project Android dari twa-manifest.json (bubblewrap di /opt/bubblewrap).
/opt/bubblewrap/node_modules/.bin/bubblewrap update --skipVersionUpgrade
echo "sdk.dir=$ANDROID_HOME" > local.properties

./gradlew --no-daemon -q assembleRelease

VERSION=$(node -p 'require("./twa-manifest.json").appVersion')
OUT="$KEYS/kasir-pusatbelanja-$VERSION.apk"
"$BT/zipalign" -f -p 4 app/build/outputs/apk/release/app-release-unsigned.apk "$KEYS/aligned.apk"
"$BT/apksigner" sign --ks "$KEYS/kasir-release.keystore" --ks-key-alias "$KEY_ALIAS" \
  --ks-pass env:KEYSTORE_PASSWORD --key-pass env:KEY_PASSWORD --out "$OUT" "$KEYS/aligned.apk"
rm -f "$KEYS/aligned.apk"

# Unduhan: https://kasir.pusatbelanja.top/download/kasir-pusatbelanja.apk (perlu login).
install -m 644 -o www-data "$OUT" ../public/download/kasir-pusatbelanja.apk
"$BT/apksigner" verify --print-certs "$OUT" | grep -i "sha-256"
echo "APK: $OUT"
