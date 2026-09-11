#pragma once
#include <Arduino.h>

struct __attribute__((packed)) TelemetryPayload {
    uint8_t  mac[6];          // ESP32 MAC Address 6 bytes
    uint16_t battery_mv;      // แบตเตอรี่ (mV) เช่น 3300 = 3.30V
    int16_t  surface_temp_x10;// Temp แบตเตอรี่ คูณ 10 (เช่น 255 = 25.5 C)
    int16_t  air_temp_x10;    // อุณหภูมิอากาศ
    uint16_t air_humidity_x10;// ความชื้นสัมพัทธ์
    uint16_t ambient_light;   // Lux
    uint16_t npk_n;           // ไนโตรเจน (mg/kg)
    uint16_t npk_p;           // ฟอสฟอรัส (mg/kg)
    uint16_t npk_k;           // โพแทสเซียม (mg/kg)
};