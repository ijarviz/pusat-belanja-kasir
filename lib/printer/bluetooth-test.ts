"use client"

import {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
} from "@/lib/printer/bluetooth"

const encoder =
  new TextEncoder()

export async function printBluetoothTest() {
  const connection =
    await connectBluetoothPrinter()

  if (
    !connection.writableCharacteristic
  ) {
    await disconnectBluetoothPrinter(
      connection.device
    )

    throw new Error(
      "Tidak ditemukan characteristic Bluetooth yang bisa digunakan untuk print."
    )
  }

  const characteristic =
    connection.writableCharacteristic

  const data =
    encoder.encode(
      [
        "\x1b\x40",
        "\x1b\x61\x01",
        "BLUETOOTH TEST\n",
        "\x1b\x61\x00",
        "------------------------------\n",
        "Bluetooth printer terhubung.\n",
        "\n",
        "\x1d\x56\x00",
      ].join("")
    )

  try {
    await characteristic.writeValueWithoutResponse(
      data
    )
  } finally {
    disconnectBluetoothPrinter(
      connection.device
    )
  }
}