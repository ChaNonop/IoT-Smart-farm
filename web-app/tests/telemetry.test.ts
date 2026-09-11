import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Zod Schema สำหรับทดสอบ Ingestion Validation
const telemetrySchema = z.object({
  mac_address: z.string().regex(/^([0-9A-FA-F]{2}:){5}([0-9A-FA-F]{2})$/, 'Invalid MAC address format'),
  battery_voltage: z.number().min(0).max(6),
  surface_temp: z.number(),
  air_temp: z.number(),
  air_humidity: z.number().min(0).max(100),
  ambient_light: z.number().min(0),
  npk: z.object({
    n: z.number().min(0),
    p: z.number().min(0),
    k: z.number().min(0),
  }),
  rssi: z.number().optional(),
  snr: z.number().optional(),
});

describe('Smart Farm Telemetry Ingestion Validation', () => {
  it('should accept valid telemetry data from LoRa Gateway', () => {
    const validData = {
      mac_address: '24:62:AB:F3:12:10',
      battery_voltage: 3.55,
      surface_temp: 28.5,
      air_temp: 31.2,
      air_humidity: 65.5,
      ambient_light: 1250,
      npk: {
        n: 45,
        p: 18,
        k: 120,
      },
      rssi: -68,
      snr: 8.5,
    };

    expect(() => telemetrySchema.parse(validData)).not.toThrow();
  });

  it('should reject invalid MAC address format', () => {
    const invalidData = {
      mac_address: 'INVALID-MAC-1234',
      battery_voltage: 3.55,
      surface_temp: 28.5,
      air_temp: 31.2,
      air_humidity: 65.5,
      ambient_light: 1250,
      npk: { n: 45, p: 18, k: 120 },
    };

    expect(() => telemetrySchema.parse(invalidData)).toThrow();
  });

  it('should reject battery voltage exceeding physical range (> 6V)', () => {
    const invalidData = {
      mac_address: '24:62:AB:F3:12:10',
      battery_voltage: 12.5, // เกินสเปกแบตเตอรี่ LiFePO4 1S
      surface_temp: 28.5,
      air_temp: 31.2,
      air_humidity: 65.5,
      ambient_light: 1250,
      npk: { n: 45, p: 18, k: 120 },
    };

    expect(() => telemetrySchema.parse(invalidData)).toThrow();
  });

  it('should reject air humidity exceeding 100%', () => {
    const invalidData = {
      mac_address: '24:62:AB:F3:12:10',
      battery_voltage: 3.5,
      surface_temp: 28.5,
      air_temp: 31.2,
      air_humidity: 105.0, // เกิน 100%
      ambient_light: 1250,
      npk: { n: 45, p: 18, k: 120 },
    };

    expect(() => telemetrySchema.parse(invalidData)).toThrow();
  });

  it('should correctly identify critical alerts for temperature and battery voltage', () => {
    const isCritical = (surfaceTemp: number, batteryVolt: number) => {
      return surfaceTemp > 45.0 || batteryVolt < 3.3;
    };

    // ปกติ
    expect(isCritical(30.0, 3.55)).toBe(false);

    // ร้อนเกิน (> 45C)
    expect(isCritical(48.2, 3.55)).toBe(true);

    // แบตเตอรี่ต่ำ (< 3.3V)
    expect(isCritical(28.0, 3.15)).toBe(true);
  });
});
