import { plog } from "@/lib/printer/logger"

export type UsbPrinterConnection = {
  device: USBDevice
  interfaceNumber: number
  endpointNumber: number
}

function getUSB() {
  plog.log("[USB] getUSB() called")

  if (
    typeof navigator === "undefined" ||
    !("usb" in navigator)
  ) {
    plog.error(
      "[USB] WebUSB tidak tersedia di browser."
    )

    throw new Error(
      "WebUSB tidak tersedia di browser ini."
    )
  }

  plog.log(
    "[USB] WebUSB tersedia.",
    navigator.usb
  )

  return navigator.usb
}

function getUsbErrorMessage(
  error: unknown
) {
  plog.error(
    "[USB] getUsbErrorMessage() error:",
    error
  )

  if (
    error instanceof DOMException
  ) {
    plog.error(
      "[USB] DOMException:",
      {
        name: error.name,
        message: error.message,
        code: error.code,
      }
    )

    switch (error.name) {
      case "NotFoundError":
        return "Printer USB tidak dipilih."

      case "SecurityError":
        return "Browser tidak memiliki izin untuk mengakses printer USB ini."

      case "NetworkError":
        return "Printer USB tidak dapat dibuka. Pastikan printer terhubung dan tidak sedang digunakan aplikasi lain."

      case "InvalidStateError":
        return "Printer USB sedang digunakan atau koneksi USB tidak dalam kondisi yang valid."

      case "NotSupportedError":
        return "Printer USB atau interface printer tidak didukung oleh WebUSB."

      case "AbortError":
        return "Koneksi printer USB dibatalkan."

      default:
        if (
          error.message
            ?.toLowerCase()
            .includes("access denied")
        ) {
          return "Akses ke printer USB ditolak. Pastikan printer terhubung langsung ke laptop, tidak sedang digunakan aplikasi lain, dan browser memiliki izin WebUSB."
        }

        return error.message
          ? `Gagal mengakses printer USB: ${error.message}`
          : "Gagal mengakses printer USB."
    }
  }

  if (error instanceof Error) {
    plog.error(
      "[USB] Error:",
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    )

    if (
      error.message
        .toLowerCase()
        .includes("access denied")
    ) {
      return "Akses ke printer USB ditolak. Pastikan printer terhubung langsung ke laptop, tidak sedang digunakan aplikasi lain, dan browser memiliki izin WebUSB."
    }

    return error.message
  }

  plog.error(
    "[USB] Unknown error:",
    error
  )

  return "Gagal menghubungkan printer USB."
}

async function openUsbPrinter(
  device: USBDevice
): Promise<UsbPrinterConnection> {
  plog.log(
    "[USB] ========================================"
  )

  plog.log(
    "[USB] openUsbPrinter() START"
  )

  plog.log(
    "[USB] Device information:",
    {
      vendorId:
        device.vendorId,

      productId:
        device.productId,

      serialNumber:
        device.serialNumber,

      productName:
        device.productName,

      manufacturerName:
        device.manufacturerName,

      opened:
        device.opened,

      configuration:
        device.configuration,
    }
  )

  try {
    /*
     * ========================================================
     * STEP 1 — OPEN DEVICE
     * ========================================================
     */

    plog.log(
      "[USB] STEP 1: Checking device.opened:",
      device.opened
    )

    if (!device.opened) {
      plog.log(
        "[USB] STEP 1: Calling device.open()..."
      )

      await device.open()

      plog.log(
        "[USB] STEP 1 SUCCESS: device.open() berhasil.",
        {
          opened:
            device.opened,

          configuration:
            device.configuration,
        }
      )
    } else {
      plog.log(
        "[USB] STEP 1 SKIP: Device sudah terbuka."
      )
    }

    /*
     * ========================================================
     * STEP 2 — CONFIGURATION
     * ========================================================
     */

    plog.log(
      "[USB] STEP 2: Checking configuration...",
      device.configuration
    )

    if (!device.configuration) {
      plog.log(
        "[USB] STEP 2: Configuration kosong."
      )

      plog.log(
        "[USB] STEP 2: Calling selectConfiguration(1)..."
      )

      await device.selectConfiguration(1)

      plog.log(
        "[USB] STEP 2 SUCCESS: selectConfiguration(1) berhasil.",
        device.configuration
      )
    } else {
      plog.log(
        "[USB] STEP 2 SKIP: Configuration sudah tersedia."
      )
    }

    const configuration =
      device.configuration

    if (!configuration) {
      plog.error(
        "[USB] STEP 2 ERROR: USB configuration tidak ditemukan."
      )

      throw new Error(
        "USB configuration tidak ditemukan."
      )
    }

    plog.log(
      "[USB] Configuration:",
      {
        configurationValue:
          configuration.configurationValue,

        configurationName:
          configuration.configurationName,

        interfacesCount:
          configuration.interfaces.length,
      }
    )

    /*
     * ========================================================
     * STEP 3 — LIST ALL INTERFACES
     * ========================================================
     */

    plog.log(
      "[USB] STEP 3: Semua USB interfaces:"
    )

    configuration.interfaces.forEach(
      (item, index) => {
        plog.log(
          `[USB] Interface ${index}:`,
          {
            interfaceNumber:
              item.interfaceNumber,

            alternate:
              item.alternate
                ? {
                    alternateSetting:
                      item.alternate
                        .alternateSetting,

                    interfaceClass:
                      item.alternate
                        .interfaceClass,

                    interfaceSubclass:
                      item.alternate
                        .interfaceSubclass,

                    interfaceProtocol:
                      item.alternate
                        .interfaceProtocol,

                    endpoints:
                      item.alternate
                        .endpoints,
                  }
                : null,
          }
        )
      }
    )

    /*
     * ========================================================
     * STEP 4 — FIND PRINTER INTERFACE
     * ========================================================
     */

    plog.log(
      "[USB] STEP 4: Mencari printer interface (class 7)..."
    )

    const usbInterface =
      configuration.interfaces.find(
        (item) =>
          item.alternate
            .interfaceClass === 7
      )

    if (!usbInterface) {
      plog.error(
        "[USB] STEP 4 ERROR: Printer interface tidak ditemukan.",
        configuration.interfaces.map(
          (item) => ({
            interfaceNumber:
              item.interfaceNumber,

            interfaceClass:
              item.alternate
                .interfaceClass,

            interfaceSubclass:
              item.alternate
                .interfaceSubclass,

            interfaceProtocol:
              item.alternate
                .interfaceProtocol,

            endpoints:
              item.alternate
                .endpoints,
          })
        )
      )

      throw new Error(
        "Interface printer USB tidak ditemukan. Pastikan perangkat yang dipilih adalah printer USB."
      )
    }

    plog.log(
      "[USB] STEP 4 SUCCESS: Printer interface ditemukan:",
      {
        interfaceNumber:
          usbInterface.interfaceNumber,

        interfaceClass:
          usbInterface.alternate
            .interfaceClass,

        interfaceSubclass:
          usbInterface.alternate
            .interfaceSubclass,

        interfaceProtocol:
          usbInterface.alternate
            .interfaceProtocol,

        endpoints:
          usbInterface.alternate
            .endpoints,
      }
    )

    /*
     * ========================================================
     * STEP 5 — FIND BULK OUT ENDPOINT
     * ========================================================
     */

    plog.log(
      "[USB] STEP 5: Mencari BULK OUT endpoint..."
    )

    plog.log(
      "[USB] STEP 5: Available endpoints:",
      usbInterface.alternate.endpoints
    )

    const endpoint =
      usbInterface.alternate.endpoints.find(
        (item) =>
          item.direction === "out" &&
          item.type === "bulk"
      )

    if (!endpoint) {
      plog.error(
        "[USB] STEP 5 ERROR: BULK OUT endpoint tidak ditemukan.",
        {
          endpoints:
            usbInterface.alternate
              .endpoints,
        }
      )

      throw new Error(
        "USB OUT endpoint printer tidak ditemukan."
      )
    }

    plog.log(
      "[USB] STEP 5 SUCCESS: Endpoint ditemukan:",
      {
        endpointNumber:
          endpoint.endpointNumber,

        direction:
          endpoint.direction,

        type:
          endpoint.type,

        packetSize:
          endpoint.packetSize,
      }
    )

    /*
     * ========================================================
     * STEP 6 — CLAIM INTERFACE
     * ========================================================
     */

    plog.log(
      "[USB] STEP 6: Akan menjalankan claimInterface()...",
      {
        interfaceNumber:
          usbInterface.interfaceNumber,

        deviceOpened:
          device.opened,

        interfaceClass:
          usbInterface.alternate
            .interfaceClass,

        interfaceSubclass:
          usbInterface.alternate
            .interfaceSubclass,

        interfaceProtocol:
          usbInterface.alternate
            .interfaceProtocol,
      }
    )

    try {
      plog.log(
        "[USB] STEP 6: Calling device.claimInterface()..."
      )

      await device.claimInterface(
        usbInterface.interfaceNumber
      )

      plog.log(
        "[USB] STEP 6 SUCCESS: claimInterface() berhasil."
      )
    } catch (claimError) {
      plog.error(
        "[USB] STEP 6 ERROR: claimInterface() GAGAL.",
        claimError
      )

      if (
        claimError instanceof DOMException
      ) {
        plog.error(
          "[USB] claimInterface DOMException:",
          {
            name:
              claimError.name,

            message:
              claimError.message,

            code:
              claimError.code,

            stack:
              claimError.stack,
          }
        )
      } else if (
        claimError instanceof Error
      ) {
        plog.error(
          "[USB] claimInterface Error:",
          {
            name:
              claimError.name,

            message:
              claimError.message,

            stack:
              claimError.stack,
          }
        )
      }

      throw claimError
    }

    /*
     * ========================================================
     * STEP 7 — SUCCESS
     * ========================================================
     */

    plog.log(
      "[USB] ========================================"
    )

    plog.log(
      "[USB] openUsbPrinter() SUCCESS"
    )

    plog.log(
      "[USB] Connection:",
      {
        vendorId:
          device.vendorId,

        productId:
          device.productId,

        serialNumber:
          device.serialNumber,

        interfaceNumber:
          usbInterface.interfaceNumber,

        endpointNumber:
          endpoint.endpointNumber,
      }
    )

    plog.log(
      "[USB] ========================================"
    )

    return {
      device,

      interfaceNumber:
        usbInterface.interfaceNumber,

      endpointNumber:
        endpoint.endpointNumber,
    }
  } catch (error) {
    plog.error(
      "[USB] ========================================"
    )

    plog.error(
      "[USB] openUsbPrinter() FAILED"
    )

    plog.error(
      "[USB] Device state saat error:",
      {
        vendorId:
          device.vendorId,

        productId:
          device.productId,

        serialNumber:
          device.serialNumber,

        productName:
          device.productName,

        manufacturerName:
          device.manufacturerName,

        opened:
          device.opened,

        configuration:
          device.configuration,
      }
    )

    plog.error(
      "[USB] Original error:",
      error
    )

    if (
      error instanceof DOMException
    ) {
      plog.error(
        "[USB] DOMException detail:",
        {
          name:
            error.name,

          message:
            error.message,

          code:
            error.code,

          stack:
            error.stack,
        }
      )
    } else if (
      error instanceof Error
    ) {
      plog.error(
        "[USB] Error detail:",
        {
          name:
            error.name,

          message:
            error.message,

          stack:
            error.stack,
        }
      )
    }

    /*
     * ========================================================
     * CLEANUP
     * ========================================================
     */

    plog.log(
      "[USB] Cleanup: device.opened =",
      device.opened
    )

    try {
      if (device.opened) {
        plog.log(
          "[USB] Cleanup: calling device.close()..."
        )

        await device.close()

        plog.log(
          "[USB] Cleanup SUCCESS: device.close() berhasil."
        )
      }
    } catch (closeError) {
      plog.warn(
        "[USB] Cleanup ERROR: gagal close device.",
        closeError
      )
    }

    plog.error(
      "[USB] ========================================"
    )

    throw new Error(
      getUsbErrorMessage(error)
    )
  }
}

export async function connectUsbPrinter(): Promise<UsbPrinterConnection> {
  plog.log(
    "[USB] ========================================"
  )

  plog.log(
    "[USB] connectUsbPrinter() START"
  )

  const usb = getUSB()

  plog.log(
    "[USB] WebUSB object:",
    usb
  )

  plog.log(
    "[USB] Browser information:",
    {
      userAgent:
        navigator.userAgent,

      platform:
        navigator.platform,

      vendor:
        navigator.vendor,

      secureContext:
        window.isSecureContext,

      origin:
        window.location.origin,
    }
  )

  plog.log(
    "[USB] Requesting USB device..."
  )

  try {
    /*
     * requestDevice() harus dipanggil sebagai
     * hasil dari user interaction, misalnya
     * klik tombol "Pilih Printer USB".
     */

    plog.log(
      "[USB] STEP REQUEST DEVICE: Calling requestDevice()..."
    )

    const device =
      await usb.requestDevice({
        filters: [],
      })

    plog.log(
      "[USB] STEP REQUEST DEVICE SUCCESS:",
      {
        vendorId:
          device.vendorId,

        productId:
          device.productId,

        vendorIdHex:
          `0x${device.vendorId
            .toString(16)
            .padStart(4, "0")
            .toUpperCase()}`,

        productIdHex:
          `0x${device.productId
            .toString(16)
            .padStart(4, "0")
            .toUpperCase()}`,

        serialNumber:
          device.serialNumber,

        manufacturerName:
          device.manufacturerName,

        productName:
          device.productName,

        opened:
          device.opened,

        configuration:
          device.configuration,
      }
    )

    plog.log(
      "[USB] Passing device to openUsbPrinter()..."
    )

    const connection =
      await openUsbPrinter(
        device
      )

    plog.log(
      "[USB] connectUsbPrinter() SUCCESS:",
      connection
    )

    plog.log(
      "[USB] ========================================"
    )

    return connection
  } catch (error) {
    plog.error(
      "[USB] ========================================"
    )

    plog.error(
      "[USB] connectUsbPrinter() FAILED"
    )

    plog.error(
      "[USB] Error:",
      error
    )

    if (
      error instanceof DOMException
    ) {
      plog.error(
        "[USB] DOMException:",
        {
          name:
            error.name,

          message:
            error.message,

          code:
            error.code,

          stack:
            error.stack,
        }
      )
    } else if (
      error instanceof Error
    ) {
      plog.error(
        "[USB] Error detail:",
        {
          name:
            error.name,

          message:
            error.message,

          stack:
            error.stack,
        }
      )
    }

    plog.error(
      "[USB] ========================================"
    )

    throw new Error(
      getUsbErrorMessage(error)
    )
  }
}

export async function connectSavedUsbPrinter(
  config: {
    vendorId: number
    productId: number
    serialNumber?: string | null
  }
): Promise<UsbPrinterConnection> {
  plog.log(
    "[USB] ========================================"
  )

  plog.log(
    "[USB] connectSavedUsbPrinter() START"
  )

  plog.log(
    "[USB] Saved printer config:",
    {
      vendorId:
        config.vendorId,

      productId:
        config.productId,

      serialNumber:
        config.serialNumber,

      vendorIdHex:
        `0x${config.vendorId
          .toString(16)
          .padStart(4, "0")
          .toUpperCase()}`,

      productIdHex:
        `0x${config.productId
          .toString(16)
          .padStart(4, "0")
          .toUpperCase()}`,
    }
  )

  const usb = getUSB()

  try {
    plog.log(
      "[USB] STEP SAVED 1: Calling usb.getDevices()..."
    )

    const devices =
      await usb.getDevices()

    plog.log(
      "[USB] STEP SAVED 1 SUCCESS: Authorized devices:",
      devices.map(
        (device) => ({
          vendorId:
            device.vendorId,

          productId:
            device.productId,

          vendorIdHex:
            `0x${device.vendorId
              .toString(16)
              .padStart(4, "0")
              .toUpperCase()}`,

          productIdHex:
            `0x${device.productId
              .toString(16)
              .padStart(4, "0")
              .toUpperCase()}`,

          serialNumber:
            device.serialNumber,

          manufacturerName:
            device.manufacturerName,

          productName:
            device.productName,

          opened:
            device.opened,

          configuration:
            device.configuration,
        })
      )
    )

    plog.log(
      "[USB] STEP SAVED 2: Searching matching device..."
    )

    const device = devices.find(
      (item) => {
        plog.log(
          "[USB] Checking device:",
          {
            vendorId:
              item.vendorId,

            productId:
              item.productId,

            serialNumber:
              item.serialNumber,

            vendorMatch:
              item.vendorId ===
              config.vendorId,

            productMatch:
              item.productId ===
              config.productId,

            serialMatch:
              !config.serialNumber ||
              item.serialNumber ===
                config.serialNumber,
          }
        )

        if (
          item.vendorId !==
            config.vendorId ||
          item.productId !==
            config.productId
        ) {
          return false
        }

        if (
          config.serialNumber &&
          item.serialNumber !==
            config.serialNumber
        ) {
          return false
        }

        return true
      }
    )

    if (!device) {
      plog.error(
        "[USB] STEP SAVED 2 ERROR: Matching device tidak ditemukan."
      )

      throw new Error(
        "Printer USB belum diizinkan pada browser di laptop ini. Hubungkan printer lalu gunakan tombol \"Tambah Printer\" → \"Pilih Printer USB\" untuk memberikan izin."
      )
    }

    plog.log(
      "[USB] STEP SAVED 2 SUCCESS: Saved printer found:",
      {
        vendorId:
          device.vendorId,

        productId:
          device.productId,

        serialNumber:
          device.serialNumber,

        manufacturerName:
          device.manufacturerName,

        productName:
          device.productName,

        opened:
          device.opened,
      }
    )

    plog.log(
      "[USB] STEP SAVED 3: Passing saved device to openUsbPrinter()..."
    )

    const connection =
      await openUsbPrinter(
        device
      )

    plog.log(
      "[USB] connectSavedUsbPrinter() SUCCESS:",
      connection
    )

    plog.log(
      "[USB] ========================================"
    )

    return connection
  } catch (error) {
    plog.error(
      "[USB] ========================================"
    )

    plog.error(
      "[USB] connectSavedUsbPrinter() FAILED"
    )

    plog.error(
      "[USB] Error:",
      error
    )

    if (
      error instanceof DOMException
    ) {
      plog.error(
        "[USB] DOMException:",
        {
          name:
            error.name,

          message:
            error.message,

          code:
            error.code,

          stack:
            error.stack,
        }
      )
    } else if (
      error instanceof Error
    ) {
      plog.error(
        "[USB] Error detail:",
        {
          name:
            error.name,

          message:
            error.message,

          stack:
            error.stack,
        }
      )
    }

    plog.error(
      "[USB] ========================================"
    )

    throw new Error(
      getUsbErrorMessage(error)
    )
  }
}

export async function printUsbTest(
  connection: UsbPrinterConnection
) {
  plog.log(
    "[USB] ========================================"
  )

  plog.log(
    "[USB] printUsbTest() START"
  )

  plog.log(
    "[USB] Connection:",
    {
      opened:
        connection.device.opened,

      vendorId:
        connection.device.vendorId,

      productId:
        connection.device.productId,

      serialNumber:
        connection.device.serialNumber,

      interfaceNumber:
        connection.interfaceNumber,

      endpointNumber:
        connection.endpointNumber,
    }
  )

  if (
    !connection.device.opened
  ) {
    plog.error(
      "[USB] printUsbTest() ERROR: Device tidak terbuka."
    )

    throw new Error(
      "Printer USB tidak sedang terhubung."
    )
  }

  const encoder =
    new TextEncoder()

  const data =
    new Uint8Array([
      // Initialize printer
      0x1b,
      0x40,

      ...encoder.encode(
        "USB TEST PRINT\n"
      ),

      ...encoder.encode(
        "==============================\n"
      ),

      ...encoder.encode(
        "Printer berhasil terhubung.\n"
      ),

      ...encoder.encode(
        "Vendor ID : 1155\n"
      ),

      ...encoder.encode(
        "Product ID: 22339\n"
      ),

      ...encoder.encode(
        "Serial    : 1C7EA3200000\n"
      ),

      ...encoder.encode(
        "==============================\n"
      ),

      // Feed paper before cutting
      0x1b,
      0x64,
      0x08,

      // Full cut
      0x1d,
      0x56,
      0x00,
    ])

  plog.log(
    "[USB] Print data:",
    {
      byteLength:
        data.byteLength,

      endpointNumber:
        connection.endpointNumber,

      data:
        Array.from(data),
    }
  )

  try {
    plog.log(
      "[USB] STEP PRINT: Calling transferOut()..."
    )

    const result =
      await connection.device.transferOut(
        connection.endpointNumber,
        data
      )

    plog.log(
      "[USB] STEP PRINT SUCCESS: transferOut() berhasil.",
      result
    )

    plog.log(
      "[USB] printUsbTest() SUCCESS"
    )

    plog.log(
      "[USB] ========================================"
    )

    return result
  } catch (error) {
    plog.error(
      "[USB] STEP PRINT ERROR: transferOut() gagal.",
      error
    )

    if (
      error instanceof DOMException
    ) {
      plog.error(
        "[USB] transferOut DOMException:",
        {
          name:
            error.name,

          message:
            error.message,

          code:
            error.code,

          stack:
            error.stack,
        }
      )
    } else if (
      error instanceof Error
    ) {
      plog.error(
        "[USB] transferOut Error:",
        {
          name:
            error.name,

          message:
            error.message,

          stack:
            error.stack,
        }
      )
    }

    plog.error(
      "[USB] ========================================"
    )

    throw new Error(
      getUsbErrorMessage(error)
    )
  }
}

export async function disconnectUsbPrinter(
  connection: UsbPrinterConnection
) {
  plog.log(
    "[USB] ========================================"
  )

  plog.log(
    "[USB] disconnectUsbPrinter() START"
  )

  plog.log(
    "[USB] Connection:",
    {
      opened:
        connection.device.opened,

      vendorId:
        connection.device.vendorId,

      productId:
        connection.device.productId,

      serialNumber:
        connection.device.serialNumber,

      interfaceNumber:
        connection.interfaceNumber,

      endpointNumber:
        connection.endpointNumber,
    }
  )

  try {
    if (
      connection.device.opened
    ) {
      plog.log(
        "[USB] STEP DISCONNECT 1: Calling releaseInterface()...",
        {
          interfaceNumber:
            connection.interfaceNumber,
        }
      )

      await connection.device.releaseInterface(
        connection.interfaceNumber
      )

      plog.log(
        "[USB] STEP DISCONNECT 1 SUCCESS: releaseInterface() berhasil."
      )
    } else {
      plog.log(
        "[USB] STEP DISCONNECT 1 SKIP: Device sudah tertutup."
      )
    }
  } catch (error) {
    plog.warn(
      "[USB] STEP DISCONNECT 1 ERROR: releaseInterface() gagal.",
      error
    )

    if (
      error instanceof DOMException
    ) {
      plog.warn(
        "[USB] releaseInterface DOMException:",
        {
          name:
            error.name,

          message:
            error.message,

          code:
            error.code,
        }
      )
    }
  }

  try {
    if (
      connection.device.opened
    ) {
      plog.log(
        "[USB] STEP DISCONNECT 2: Calling device.close()..."
      )

      await connection.device.close()

      plog.log(
        "[USB] STEP DISCONNECT 2 SUCCESS: device.close() berhasil."
      )
    } else {
      plog.log(
        "[USB] STEP DISCONNECT 2 SKIP: Device sudah tertutup."
      )
    }
  } catch (error) {
    plog.warn(
      "[USB] STEP DISCONNECT 2 ERROR: device.close() gagal.",
      error
    )

    if (
      error instanceof DOMException
    ) {
      plog.warn(
        "[USB] close DOMException:",
        {
          name:
            error.name,

          message:
            error.message,

          code:
            error.code,
        }
      )
    }
  }

  plog.log(
    "[USB] disconnectUsbPrinter() COMPLETE"
  )

  plog.log(
    "[USB] ========================================"
  )
}