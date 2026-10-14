// Encoder Code128 minimal — menghasilkan pola lebar bar untuk dirender sebagai
// SVG. Tanpa dependency eksternal supaya aman saat render via Puppeteer (Vercel).
//
// Mendukung Code Set B (ASCII 32–126: angka, huruf besar/kecil, simbol umum) —
// cukup untuk nomor AWB. Bila string memuat karakter di luar rentang itu,
// fungsi mengembalikan null (pemanggil bisa fallback ke teks).
//
// Output: array lebar modul bergantian gelap/terang, diawali bar gelap.
// mis. [2,1,2,2,...] = bar gelap 2 modul, spasi 1 modul, bar gelap 2 modul, ...

// 107 pola Code128 (indeks 0–106). Tiap pola = 6 angka lebar bar/spasi.
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213",
  "122312", "132212", "221213", "221312", "231212", "112232", "122132",
  "122231", "113222", "123122", "123221", "223211", "221132", "221231",
  "213212", "223112", "312131", "311222", "321122", "321221", "312212",
  "322112", "322211", "212123", "212321", "232121", "111323", "131123",
  "131321", "112313", "132113", "132311", "211313", "231113", "231311",
  "112133", "112331", "132131", "113123", "113321", "133121", "313121",
  "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111",
  "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114",
  "413111", "241112", "134111", "111242", "121142", "121241", "114212",
  "124112", "124211", "411212", "421112", "421211", "212141", "214121",
  "412121", "111143", "111341", "131141", "114113", "114311", "411113",
  "411311", "113141", "114131", "311141", "411131", "211412", "211214",
  "211232", "2331112", // 106 = STOP (7 elemen)
]

const START_B = 104
const STOP = 106

/**
 * Encode `value` (Code Set B) menjadi array lebar modul bergantian gelap/terang.
 * Return null bila ada karakter di luar ASCII 32–126.
 */
export function encodeCode128B(value: string): number[] | null {
  if (!value) return null

  const codes: number[] = [START_B]
  let checksum = START_B

  for (let i = 0; i < value.length; i++) {
    const cc = value.charCodeAt(i)
    if (cc < 32 || cc > 126) return null
    const code = cc - 32 // Code Set B: nilai = ASCII - 32
    codes.push(code)
    checksum += code * (i + 1)
  }

  codes.push(checksum % 103) // check character
  codes.push(STOP)

  // Gabungkan pola tiap kode menjadi satu deret lebar modul.
  const widths: number[] = []
  for (const code of codes) {
    for (const ch of PATTERNS[code]) {
      widths.push(Number(ch))
    }
  }
  return widths
}
