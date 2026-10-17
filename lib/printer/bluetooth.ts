import { plog } from "@/lib/printer/logger"

export type BluetoothCharacteristicInfo = {
  uuid: string
  properties: string[]
}

export type BluetoothServiceInfo = {
  uuid: string
  characteristics: BluetoothCharacteristicInfo[]
}

export type BluetoothPrinterConnection = {
  device: BluetoothDevice
  server: BluetoothRemoteGATTServer
  services: BluetoothServiceInfo[]
  writableCharacteristic:
    | BluetoothRemoteGATTCharacteristic
    | null
}

/*
 * Perangkat Bluetooth yang sudah dipilih user di sesi halaman ini. Chrome
 * Android tidak punya navigator.bluetooth.getDevices(), jadi tanpa ini
 * setiap cetak harus memilih perangkat lagi. Bertahan selama halaman tidak
 * dimuat ulang (sidebar memakai navigasi client-side, lihat nav-main.tsx).
 */
const knownDevices = new Map<string, BluetoothDevice>()

function rememberDevice(device: BluetoothDevice) {
  knownDevices.set(device.id, device)
}

function getBluetooth() {
  if (
    typeof navigator === "undefined" ||
    !("bluetooth" in navigator)
  ) {
    throw new Error(
      "Web Bluetooth tidak tersedia di browser ini."
    )
  }

  return navigator.bluetooth
}

function getCharacteristicProperties(
  characteristic: BluetoothRemoteGATTCharacteristic
) {
  const properties: string[] = []

  if (characteristic.properties.broadcast) {
    properties.push("broadcast")
  }

  if (characteristic.properties.read) {
    properties.push("read")
  }

  if (
    characteristic.properties.writeWithoutResponse
  ) {
    properties.push("writeWithoutResponse")
  }

  if (characteristic.properties.write) {
    properties.push("write")
  }

  if (characteristic.properties.notify) {
    properties.push("notify")
  }

  if (characteristic.properties.indicate) {
    properties.push("indicate")
  }

  if (
    characteristic.properties
      .authenticatedSignedWrites
  ) {
    properties.push(
      "authenticatedSignedWrites"
    )
  }

  return properties
}

export async function connectBluetoothPrinter(): Promise<BluetoothPrinterConnection> {
  const bluetooth = getBluetooth()

  plog.log(
    "[Bluetooth] Requesting device..."
  )

  const device =
    await bluetooth.requestDevice({
      acceptAllDevices: true,

      optionalServices: [
        "0000ff00-0000-1000-8000-00805f9b34fb",
      ],
    })

  plog.log(
    "[Bluetooth] Device selected:",
    {
      id: device.id,
      name: device.name,
    }
  )

  rememberDevice(device)

  if (!device.gatt) {
    throw new Error(
      "Printer tidak menyediakan koneksi GATT."
    )
  }

  plog.log(
    "[Bluetooth] Connecting GATT..."
  )

  let server: BluetoothRemoteGATTServer

  try {
    server =
      await device.gatt.connect()
  } catch (error) {
    plog.error(
      "[Bluetooth] GATT connection failed:",
      error
    )

    throw new Error(
      error instanceof Error
        ? `Gagal menghubungkan printer Bluetooth: ${error.message}`
        : "Gagal menghubungkan printer Bluetooth."
    )
  }

  plog.log(
    "[Bluetooth] GATT connected:",
    server.connected
  )

  const primaryServices =
    await server.getPrimaryServices()

  plog.log(
    "[Bluetooth] Services:",
    primaryServices.map(
      (service) => service.uuid
    )
  )

  const services: BluetoothServiceInfo[] =
    []

  let writableCharacteristic:
    | BluetoothRemoteGATTCharacteristic
    | null = null

  for (const service of primaryServices) {
    plog.log(
      "[Bluetooth] Service:",
      service.uuid
    )

    const characteristics: BluetoothCharacteristicInfo[] =
      []

    try {
      const serviceCharacteristics =
        await service.getCharacteristics()

      for (
        const characteristic
        of serviceCharacteristics
      ) {
        const properties =
          getCharacteristicProperties(
            characteristic
          )

        plog.log(
          "[Bluetooth] Characteristic:",
          {
            service:
              service.uuid,

            characteristic:
              characteristic.uuid,

            properties,
          }
        )

        characteristics.push({
          uuid:
            characteristic.uuid,

          properties,
        })

        // Prioritaskan characteristic printer
        if (
          characteristic.uuid.toLowerCase() ===
          "0000ff02-0000-1000-8000-00805f9b34fb"
        ) {
          if (
            characteristic.properties
              .writeWithoutResponse ||
            characteristic.properties
              .write
          ) {
            writableCharacteristic =
              characteristic

            plog.log(
              "[Bluetooth] Printer writable characteristic found:",
              characteristic.uuid
            )
          }
        }
      }
    } catch (error) {
      plog.warn(
        "[Bluetooth] Failed to read characteristics:",
        service.uuid,
        error
      )
    }

    services.push({
      uuid:
        service.uuid,

      characteristics,
    })
  }

  // Fallback kalau characteristic UUID berubah
  if (!writableCharacteristic) {
    for (const service of primaryServices) {
      try {
        const characteristics =
          await service.getCharacteristics()

        const fallback =
          characteristics.find(
            (characteristic) =>
              characteristic.properties
                .writeWithoutResponse ||
              characteristic.properties
                .write
          )

        if (fallback) {
          writableCharacteristic =
            fallback

          plog.log(
            "[Bluetooth] Fallback writable characteristic:",
            fallback.uuid
          )

          break
        }
      } catch {
        // Abaikan service yang gagal dibaca
      }
    }
  }

  if (!writableCharacteristic) {
    throw new Error(
      "Characteristic Bluetooth untuk print tidak ditemukan."
    )
  }

  return {
    device,
    server,
    services,
    writableCharacteristic,
  }
}

export async function disconnectBluetoothPrinter(
  device: BluetoothDevice
) {
  if (device.gatt?.connected) {
    device.gatt.disconnect()
  }
}

const BLUETOOTH_CHUNK_SIZE = 100

const BLUETOOTH_CHUNK_DELAY = 10

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  )
}

export async function writeBluetoothData(
  connection: BluetoothPrinterConnection,
  data: Uint8Array
) {
  const characteristic =
    connection.writableCharacteristic

  if (!characteristic) {
    throw new Error(
      "Characteristic Bluetooth untuk print tidak ditemukan."
    )
  }

  if (
    !connection.server.connected
  ) {
    throw new Error(
      "Koneksi Bluetooth printer sudah terputus."
    )
  }

  if (
    !characteristic.properties
      .writeWithoutResponse
  ) {
    throw new Error(
      "Characteristic Bluetooth tidak mendukung writeWithoutResponse."
    )
  }

  plog.log(
    "[Bluetooth] Writing data:",
    {
      bytes:
        data.byteLength,

      chunkSize:
        BLUETOOTH_CHUNK_SIZE,
    }
  )

  for (
    let offset = 0;
    offset < data.length;
    offset +=
      BLUETOOTH_CHUNK_SIZE
  ) {
    const chunk =
      data.slice(
        offset,
        offset +
          BLUETOOTH_CHUNK_SIZE
      )

    plog.log(
      "[Bluetooth] Sending chunk:",
      {
        offset,
        size:
          chunk.byteLength,
      }
    )

    await characteristic.writeValueWithoutResponse(
      chunk
    )

    await sleep(
      BLUETOOTH_CHUNK_DELAY
    )
  }

  plog.log(
    "[Bluetooth] All data sent successfully"
  )
}

export async function printBluetoothTest(
  connection: BluetoothPrinterConnection
) {
  const encoder =
    new TextEncoder()

  const data =
    encoder.encode(
      [
        "\x1b\x40",
        "\x1b\x61\x01",
        "BLUETOOTH TEST\n",
        "\n",
        "\x1b\x61\x00",
        "Bluetooth berhasil!\n",
        "------------------------------\n",
        "\n",
        "\x1d\x56\x00",
      ].join("")
    )

  await writeBluetoothData(
    connection,
    data
  )
}


export type SavedBluetoothPrinterConfig = {
  deviceId: string
  deviceName?: string | null
  serviceUuid?: string | null
  characteristicUuid?: string | null
}

export async function connectSavedBluetoothPrinter(
  config: SavedBluetoothPrinterConfig
): Promise<BluetoothPrinterConnection> {
  const bluetooth = getBluetooth()

  if (!bluetooth) {
    throw new Error(
      "Browser tidak mendukung Web Bluetooth."
    )
  }

  const device = await findSavedDevice(
    bluetooth,
    config
  )

  plog.log(
    "[Bluetooth Saved] Device found:",
    {
      id: device.id,
      name: device.name,
    }
  )

  plog.log(
    "[Bluetooth Saved] GATT status:",
    { connected: device.gatt?.connected ?? false }
  )

  let server: BluetoothRemoteGATTServer | undefined

  try {
    server =
      device.gatt?.connected
        ? device.gatt
        : await device.gatt?.connect()
  } catch (error) {
    plog.error(
      "[Bluetooth Saved] GATT connect failed:",
      error
    )

    throw new Error(
      `Gagal menyambung ke printer "${device.name ?? config.deviceName ?? ""}". Pastikan printer menyala dan dekat dengan perangkat.`
    )
  }

  if (!server) {
    throw new Error(
      "Gagal menghubungkan GATT printer Bluetooth."
    )
  }

  plog.log(
    "[Bluetooth Saved] GATT connected:",
    server.connected
  )

  const services =
    await server.getPrimaryServices()

  const serviceInfos: BluetoothServiceInfo[] = []

  let writableCharacteristic:
    | BluetoothRemoteGATTCharacteristic
    | null = null

  for (const service of services) {
    const characteristics =
      await service.getCharacteristics()

    const characteristicInfos: BluetoothCharacteristicInfo[] =
      characteristics.map(
        (characteristic) => ({
          uuid:
            characteristic.uuid,

          properties:
            Object.entries(
              characteristic.properties
            )
              .filter(
                ([, value]) =>
                  value === true
              )
              .map(
                ([key]) => key
              ),
        })
      )

    serviceInfos.push({
      uuid: service.uuid,
      characteristics:
        characteristicInfos,
    })

    const targetCharacteristic =
      config.characteristicUuid
        ? characteristics.find(
            (characteristic) =>
              characteristic.uuid.toLowerCase() ===
              config.characteristicUuid!.toLowerCase()
          )
        : null

    if (
      targetCharacteristic &&
      (
        targetCharacteristic
          .properties
          .writeWithoutResponse ||
        targetCharacteristic
          .properties
          .write
      )
    ) {
      writableCharacteristic =
        targetCharacteristic
    }
  }

  if (!writableCharacteristic) {
    throw new Error(
      `Characteristic Bluetooth ${config.characteristicUuid ?? ""} tidak ditemukan atau tidak mendukung penulisan.`
    )
  }

  plog.log(
    "[Bluetooth Saved] Writable characteristic:",
    writableCharacteristic.uuid
  )

  return {
    device,
    server,
    services: serviceInfos,
    writableCharacteristic,
  }
}
/*
 * Cari perangkat printer tersimpan, berurutan:
 *   1. yang sudah dipilih di sesi halaman ini (knownDevices),
 *   2. navigator.bluetooth.getDevices() (Chrome desktop),
 *   3. pemilih Bluetooth yang difilter nama printer tersimpan: di Chrome
 *      Android cukup satu tap. Harus dipanggil dari klik (user gesture).
 */
async function findSavedDevice(
  bluetooth: Bluetooth,
  config: SavedBluetoothPrinterConfig
): Promise<BluetoothDevice> {
  const matches = (device: BluetoothDevice) =>
    device.id === config.deviceId ||
    (!!config.deviceName &&
      device.name === config.deviceName)

  const known = [...knownDevices.values()].find(matches)

  if (known) {
    plog.log(
      "[Bluetooth Saved] Pakai perangkat dari sesi ini:",
      { id: known.id, name: known.name }
    )
    return known
  }

  if (typeof bluetooth.getDevices === "function") {
    const devices =
      await bluetooth.getDevices()

    plog.log(
      "[Bluetooth Saved] Authorized devices:",
      devices.map((device) => ({
        id: device.id,
        name: device.name,
      }))
    )

    const device = devices.find(matches)

    if (device) {
      rememberDevice(device)
      return device
    }
  } else {
    plog.log(
      "[Bluetooth Saved] getDevices() tidak tersedia, buka pemilih perangkat"
    )
  }

  const optionalServices = [
    "0000ff00-0000-1000-8000-00805f9b34fb",
    ...(config.serviceUuid
      ? [config.serviceUuid.toLowerCase()]
      : []),
  ]

  let device: BluetoothDevice

  try {
    device = await bluetooth.requestDevice(
      config.deviceName
        ? {
            filters: [{ name: config.deviceName }],
            optionalServices,
          }
        : {
            acceptAllDevices: true,
            optionalServices,
          }
    )
  } catch (error) {
    plog.error(
      "[Bluetooth Saved] requestDevice gagal:",
      error
    )

    if (
      error instanceof DOMException &&
      error.name === "NotFoundError"
    ) {
      throw new Error(
        `Printer "${config.deviceName ?? "Bluetooth"}" tidak dipilih atau tidak ditemukan. Pastikan printer menyala, lalu pilih printernya saat diminta.`
      )
    }

    if (
      error instanceof DOMException &&
      error.name === "SecurityError"
    ) {
      throw new Error(
        "Browser meminta printer dipilih langsung dari tombol cetak. Silakan tekan tombol cetak sekali lagi."
      )
    }

    throw error
  }

  plog.log(
    "[Bluetooth Saved] Device dipilih ulang:",
    { id: device.id, name: device.name }
  )

  rememberDevice(device)

  return device
}
