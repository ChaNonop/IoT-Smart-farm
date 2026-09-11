#pragma once
#include <Arduino.h>

constexpr char* WIFI_SSID     = "somwang";
constexpr char* WIFI_PASSWORD = "03143681";

// --- Power Gating & Battery ---
constexpr uint8_t PIN_PMOS_GATE       = 25;  // ดึง LOW เพื่อจ่ายไฟเลี้ยงเซนเซอร์
constexpr uint8_t PIN_BATTERY_ADC     = 34;  // ขาอ่าน Voltage Divider
constexpr float   BATTERY_LOW_THRESH   = 3.3f; // ต่ำกว่านี้เข้าสู่โหมดประหยัดพลังงาน

// --- Sleep Intervals (วินาที) ---
constexpr uint32_t SLEEP_SEC_NORMAL   = 5 * 60;   // 5 นาที
constexpr uint32_t SLEEP_SEC_LOW_BATT = 10 * 60;  // 10 นาที

// --- Sensors Pinout ---
constexpr uint8_t PIN_DHT             = 4;
constexpr uint8_t PIN_RS485_RX        = 16;
constexpr uint8_t PIN_RS485_TX        = 17;
constexpr uint8_t PIN_RS485_DE_RE     = 5;
constexpr uint8_t PIN_THERMO_CS       = 15;

// --- LoRa (SX1276/SX1278) ---
// constexpr long    LORA_BAND           = 915E6; // หรือ 868E6 ตามโมดูล
// constexpr uint8_t PIN_LORA_SS         = 18;
// constexpr uint8_t PIN_LORA_RST        = 14;
// constexpr uint8_t PIN_LORA_DIO0       = 26;