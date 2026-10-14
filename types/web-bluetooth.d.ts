interface BluetoothCharacteristicProperties {
  broadcast: boolean
  read: boolean
  writeWithoutResponse: boolean
  write: boolean
  notify: boolean
  indicate: boolean
  authenticatedSignedWrites: boolean
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: string
  properties: BluetoothCharacteristicProperties

  writeValueWithResponse(
    value: BufferSource
  ): Promise<void>

  writeValueWithoutResponse(
    value: BufferSource
  ): Promise<void>
}

interface BluetoothRemoteGATTService {
  uuid: string

  getCharacteristics(): Promise<
    BluetoothRemoteGATTCharacteristic[]
  >
}

interface BluetoothRemoteGATTServer {
  connected: boolean

  connect(): Promise<BluetoothRemoteGATTServer>

  disconnect(): void

  getPrimaryServices(): Promise<
    BluetoothRemoteGATTService[]
  >
}

interface BluetoothDevice {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void
}

interface Bluetooth {
  requestDevice(options: {
    acceptAllDevices?: boolean
    optionalServices?: BluetoothServiceUUID[]
  }): Promise<BluetoothDevice>

  getDevices(): Promise<BluetoothDevice[]>
}

interface Navigator {
  bluetooth: Bluetooth
}