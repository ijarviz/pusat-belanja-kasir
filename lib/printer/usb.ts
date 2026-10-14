export type UsbPrinterConnection = {
  device: USBDevice
  interfaceNumber: number
  endpointNumber: number
}

function getUSB() {
  console.log("[USB] getUSB() called")

  if (
    typeof navigator === "undefined" ||
    !("usb" in navigator)
  ) {
    console.error(
      "[USB] WebUSB tidak tersedia di browser."
    )

    throw new Error(
      "WebUSB tidak tersedia di browser ini."
    )
  }

  console.log(
    "[USB] WebUSB tersedia.",
    navigator.usb
  )

  return navigator.usb
}

function getUsbErrorMessage(
  error: unknown
) {
  console.error(
    "[USB] getUsbErrorMessage() error:",
    error
  )

  if (
    error instanceof DOMException
  ) {
    console.error(
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
    console.error(
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

  console.error(
    "[USB] Unknown error:",
    error
  )

  return "Gagal menghubungkan printer USB."
}

async function openUsbPrinter(
  device: USBDevice
): Promise<UsbPrinterConnection> {
  console.log(
    "[USB] ========================================"
  )

  console.log(
    "[USB] openUsbPrinter() START"
  )

  console.log(
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

    console.log(
      "[USB] STEP 1: Checking device.opened:",
      device.opened
    )

    if (!device.opened) {
      console.log(
        "[USB] STEP 1: Calling device.open()..."
      )

      await device.open()

      console.log(
        "[USB] STEP 1 SUCCESS: device.open() berhasil.",
        {
          opened:
            device.opened,

          configuration:
            device.configuration,
        }
      )
    } else {
      console.log(
        "[USB] STEP 1 SKIP: Device sudah terbuka."
      )
    }

    /*
     * ========================================================
     * STEP 2 — CONFIGURATION
     * ========================================================
     */

    console.log(
      "[USB] STEP 2: Checking configuration...",
      device.configuration
    )

    if (!device.configuration) {
      console.log(
        "[USB] STEP 2: Configuration kosong."
      )

      console.log(
        "[USB] STEP 2: Calling selectConfiguration(1)..."
      )

      await device.selectConfiguration(1)

      console.log(
        "[USB] STEP 2 SUCCESS: selectConfiguration(1) berhasil.",
        device.configuration
      )
    } else {
      console.log(
        "[USB] STEP 2 SKIP: Configuration sudah tersedia."
      )
    }

    const configuration =
      device.configuration

    if (!configuration) {
      console.error(
        "[USB] STEP 2 ERROR: USB configuration tidak ditemukan."
      )

      throw new Error(
        "USB configuration tidak ditemukan."
      )
    }

    console.log(
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

    console.log(
      "[USB] STEP 3: Semua USB interfaces:"
    )

    configuration.interfaces.forEach(
      (item, index) => {
        console.log(
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

    console.log(
      "[USB] STEP 4: Mencari printer interface (class 7)..."
    )

    const usbInterface =
      configuration.interfaces.find(
        (item) =>
          item.alternate
            .interfaceClass === 7
      )

    if (!usbInterface) {
      console.error(
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

    console.log(
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

    console.log(
      "[USB] STEP 5: Mencari BULK OUT endpoint..."
    )

    console.log(
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
      console.error(
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

    console.log(
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

    console.log(
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
      console.log(
        "[USB] STEP 6: Calling device.claimInterface()..."
      )

      await device.claimInterface(
        usbInterface.interfaceNumber
      )

      console.log(
        "[USB] STEP 6 SUCCESS: claimInterface() berhasil."
      )
    } catch (claimError) {
      console.error(
        "[USB] STEP 6 ERROR: claimInterface() GAGAL.",
        claimError
      )

      if (
        claimError instanceof DOMException
      ) {
        console.error(
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
        console.error(
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

    console.log(
      "[USB] ========================================"
    )

    console.log(
      "[USB] openUsbPrinter() SUCCESS"
    )

    console.log(
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

    console.log(
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
    console.error(
      "[USB] ========================================"
    )

    console.error(
      "[USB] openUsbPrinter() FAILED"
    )

    console.error(
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

    console.error(
      "[USB] Original error:",
      error
    )

    if (
      error instanceof DOMException
    ) {
      console.error(
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
      console.error(
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

    console.log(
      "[USB] Cleanup: device.opened =",
      device.opened
    )

    try {
      if (device.opened) {
        console.log(
          "[USB] Cleanup: calling device.close()..."
        )

        await device.close()

        console.log(
          "[USB] Cleanup SUCCESS: device.close() berhasil."
        )
      }
    } catch (closeError) {
      console.warn(
        "[USB] Cleanup ERROR: gagal close device.",
        closeError
      )
    }

    console.error(
      "[USB] ========================================"
    )

    throw new Error(
      getUsbErrorMessage(error)
    )
  }
}

export async function connectUsbPrinter(): Promise<UsbPrinterConnection> {
  console.log(
    "[USB] ========================================"
  )

  console.log(
    "[USB] connectUsbPrinter() START"
  )

  const usb = getUSB()

  console.log(
    "[USB] WebUSB object:",
    usb
  )

  console.log(
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

  console.log(
    "[USB] Requesting USB device..."
  )

  try {
    /*
     * requestDevice() harus dipanggil sebagai
     * hasil dari user interaction, misalnya
     * klik tombol "Pilih Printer USB".
     */

    console.log(
      "[USB] STEP REQUEST DEVICE: Calling requestDevice()..."
    )

    const device =
      await usb.requestDevice({
        filters: [],
      })

    console.log(
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

    console.log(
      "[USB] Passing device to openUsbPrinter()..."
    )

    const connection =
      await openUsbPrinter(
        device
      )

    console.log(
      "[USB] connectUsbPrinter() SUCCESS:",
      connection
    )

    console.log(
      "[USB] ========================================"
    )

    return connection
  } catch (error) {
    console.error(
      "[USB] ========================================"
    )

    console.error(
      "[USB] connectUsbPrinter() FAILED"
    )

    console.error(
      "[USB] Error:",
      error
    )

    if (
      error instanceof DOMException
    ) {
      console.error(
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
      console.error(
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

    console.error(
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
  console.log(
    "[USB] ========================================"
  )

  console.log(
    "[USB] connectSavedUsbPrinter() START"
  )

  console.log(
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
    console.log(
      "[USB] STEP SAVED 1: Calling usb.getDevices()..."
    )

    const devices =
      await usb.getDevices()

    console.log(
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

    console.log(
      "[USB] STEP SAVED 2: Searching matching device..."
    )

    const device = devices.find(
      (item) => {
        console.log(
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
      console.error(
        "[USB] STEP SAVED 2 ERROR: Matching device tidak ditemukan."
      )

      throw new Error(
        "Printer USB belum diizinkan pada browser di laptop ini. Hubungkan printer lalu gunakan tombol \"Tambah Printer\" → \"Pilih Printer USB\" untuk memberikan izin."
      )
    }

    console.log(
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

    console.log(
      "[USB] STEP SAVED 3: Passing saved device to openUsbPrinter()..."
    )

    const connection =
      await openUsbPrinter(
        device
      )

    console.log(
      "[USB] connectSavedUsbPrinter() SUCCESS:",
      connection
    )

    console.log(
      "[USB] ========================================"
    )

    return connection
  } catch (error) {
    console.error(
      "[USB] ========================================"
    )

    console.error(
      "[USB] connectSavedUsbPrinter() FAILED"
    )

    console.error(
      "[USB] Error:",
      error
    )

    if (
      error instanceof DOMException
    ) {
      console.error(
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
      console.error(
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

    console.error(
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
  console.log(
    "[USB] ========================================"
  )

  console.log(
    "[USB] printUsbTest() START"
  )

  console.log(
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
    console.error(
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

  console.log(
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
    console.log(
      "[USB] STEP PRINT: Calling transferOut()..."
    )

    const result =
      await connection.device.transferOut(
        connection.endpointNumber,
        data
      )

    console.log(
      "[USB] STEP PRINT SUCCESS: transferOut() berhasil.",
      result
    )

    console.log(
      "[USB] printUsbTest() SUCCESS"
    )

    console.log(
      "[USB] ========================================"
    )

    return result
  } catch (error) {
    console.error(
      "[USB] STEP PRINT ERROR: transferOut() gagal.",
      error
    )

    if (
      error instanceof DOMException
    ) {
      console.error(
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
      console.error(
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

    console.error(
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
  console.log(
    "[USB] ========================================"
  )

  console.log(
    "[USB] disconnectUsbPrinter() START"
  )

  console.log(
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
      console.log(
        "[USB] STEP DISCONNECT 1: Calling releaseInterface()...",
        {
          interfaceNumber:
            connection.interfaceNumber,
        }
      )

      await connection.device.releaseInterface(
        connection.interfaceNumber
      )

      console.log(
        "[USB] STEP DISCONNECT 1 SUCCESS: releaseInterface() berhasil."
      )
    } else {
      console.log(
        "[USB] STEP DISCONNECT 1 SKIP: Device sudah tertutup."
      )
    }
  } catch (error) {
    console.warn(
      "[USB] STEP DISCONNECT 1 ERROR: releaseInterface() gagal.",
      error
    )

    if (
      error instanceof DOMException
    ) {
      console.warn(
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
      console.log(
        "[USB] STEP DISCONNECT 2: Calling device.close()..."
      )

      await connection.device.close()

      console.log(
        "[USB] STEP DISCONNECT 2 SUCCESS: device.close() berhasil."
      )
    } else {
      console.log(
        "[USB] STEP DISCONNECT 2 SKIP: Device sudah tertutup."
      )
    }
  } catch (error) {
    console.warn(
      "[USB] STEP DISCONNECT 2 ERROR: device.close() gagal.",
      error
    )

    if (
      error instanceof DOMException
    ) {
      console.warn(
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

  console.log(
    "[USB] disconnectUsbPrinter() COMPLETE"
  )

  console.log(
    "[USB] ========================================"
  )
}