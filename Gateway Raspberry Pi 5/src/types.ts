export interface TelemetryData {
  mac_address: string;
  battery_voltage: number;
  surface_temp: number;
  air_temp: number;
  air_humidity: number;
  ambient_light: number;
  npk: {
    n: number;
    p: number;
    k: number;
  };
  rssi?: number;
  snr?: number;
}
