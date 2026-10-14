interface USBEndpoint {
  endpointNumber: number
  direction: "in" | "out"
  type: "bulk" | "interrupt" | "isochronous"
  packetSize: number
}

interface USBAlternateInterface {
  alternateSetting: number
  interfaceClass: number
  interfaceSubclass: number
  interfaceProtocol: number
  endpoints: USBEndpoint[]
}

interface USBInterface {
  interfaceNumber: number
  alternate: USBAlternateInterface
}

interface USBConfiguration {
  configurationValue: number
  configurationName?: string | null
  interfaces: USBInterface[]
}

interface USBOutTransferResult {
  bytesWritten: number
  status: string
}

interface USBDevice {
  usbVersionMajor: number
  usbVersionMinor: number
  usbVersionSubminor: number

  deviceClass: number
  deviceSubclass: number
  deviceProtocol: number

  vendorId: number
  productId: number

  manufacturerName?: string
  productName?: string
  serialNumber?: string

  opened: boolean

  configuration: USBConfiguration | null

  open(): Promise<void>

  close(): Promise<void>

  selectConfiguration(
    configurationValue: number
  ): Promise<void>

  claimInterface(
    interfaceNumber: number
  ): Promise<void>

  releaseInterface(
    interfaceNumber: number
  ): Promise<void>

  transferOut(
    endpointNumber: number,
    data: BufferSource
  ): Promise<USBOutTransferResult>
}

interface USBDeviceFilter {
  vendorId?: number
  productId?: number
  classCode?: number
  subclassCode?: number
  protocolCode?: number
}

interface USBRequestDeviceOptions {
  filters: USBDeviceFilter[]
}

interface USB {
  requestDevice(
    options: USBRequestDeviceOptions
  ): Promise<USBDevice>

  getDevices(): Promise<USBDevice[]>
}

interface Navigator {
  usb: USB
}