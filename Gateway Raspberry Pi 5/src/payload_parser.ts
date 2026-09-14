import { TelemetryData } from './types';

export const EXPECTED_PAYLOAD_SIZE = 22;

export function parseLoRaPayload(buffer: Buffer, rssi?: number, snr?: number): TelemetryData | null {
  if (buffer.length < EXPECTED_PAYLOAD_SIZE) {
    console.warn(`[Parser] Payload size (${buffer.length} bytes) is less than expected (${EXPECTED_PAYLOAD_SIZE} bytes)`);
    return null;
  }

  // 1. ถอดรหัส MAC Address 6 bytes (XX:XX:XX:XX:XX:XX)
  const macParts: string[] = [];
  for (let i = 0; i < 6; i++) {
    macParts.push(buffer[i].toString(16).padStart(2, '0').toUpperCase());
  }
  const mac_address = macParts.join(':');

  // 2. ถอดรหัสค่าตัวเลข (Little Endian ตามสถาปัตยกรรม ESP32)
  const battery_mv = buffer.readUInt16LE(6);
  const surface_temp_x10 = buffer.readInt16LE(8);
  const air_temp_x10 = buffer.readInt16LE(10);
  const air_humidity_x10 = buffer.readUInt16LE(12);
  const ambient_light = buffer.readUInt16LE(14);
  const npk_n = buffer.readUInt16LE(16);
  const npk_p = buffer.readUInt16LE(18);
  const npk_k = buffer.readUInt16LE(20);

  return {
    mac_address,
    battery_voltage: Number((battery_mv / 1000.0).toFixed(2)),
    surface_temp: Number((surface_temp_x10 / 10.0).toFixed(1)),
    air_temp: Number((air_temp_x10 / 10.0).toFixed(1)),
    air_humidity: Number((air_humidity_x10 / 10.0).toFixed(1)),
    ambient_light,
    npk: {
      n: npk_n,
      p: npk_p,
      k: npk_k,
    },
    rssi,
    snr,
  };
}
