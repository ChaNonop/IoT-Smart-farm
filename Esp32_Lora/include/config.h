#pragma once
#include <Arduino.h>

// --- Wi-Fi Credentials (สำหรับโหมดทดลอง / ฉุกเฉิน) ---
constexpr const char* WIFI_SSID     = "somwang";
constexpr const char* WIFI_PASSWORD = "03143681";

// --- Power Gating & Battery ---
constexpr uint8_t PIN_PMOS_GATE         = 25;   // ดึง LOW เพื่อเปิด P-MOSFET จ่ายไฟเลี้ยงเซนเซอร์
constexpr uint8_t PIN_BATTERY_ADC       = 34;   // ขาอ่าน Voltage Divider
constexpr float   BATTERY_CRITICAL_VOLT = 3.0f; // แรงดันวิกฤต (<10%) สั่งหลับยาวรอชาร์จ
constexpr float   BATTERY_LOW_THRESH    = 3.3f; // ต่ำกว่านี้คือ Low Battery (<=30%)

// --- Sleep Intervals (วินาที) ---
constexpr uint32_t SLEEP_SEC_NORMAL     = 5 * 60;   // 5 นาที (แบตเตอรี่ > 30%)
constexpr uint32_t SLEEP_SEC_LOW_BATT   = 10 * 60;  // 10 นาที (แบตเตอรี่ 10-30%)
constexpr uint32_t SLEEP_SEC_CRITICAL   = 30 * 60;  // 30 นาที (แบตเตอรี่วิกฤต <10%)

// --- RTC (DS3231 I2C & Interrupt) ---
constexpr uint8_t PIN_I2C_SDA           = 21;
constexpr uint8_t PIN_I2C_SCL           = 22;
constexpr gpio_num_t PIN_RTC_INT        = GPIO_NUM_33; // ขา Interrupt ต่อจาก SQW/INT ของ DS3231 (RTC Wakeup)

// --- Sensors Pinout ---
constexpr uint8_t PIN_DHT               = 4;    // DHT22 Data
constexpr uint8_t PIN_RS485_RX          = 16;   // RO (HardwareSerial 2)
constexpr uint8_t PIN_RS485_TX          = 17;   // DI (HardwareSerial 2)
constexpr uint8_t PIN_RS485_DE_RE       = 5;    // Driver Enable / Receiver Enable
constexpr uint8_t PIN_THERMO_CS         = 15;   // Chip Select สำหรับ MAX6675/MAX31855 K-Type

// --- LoRa Transceiver (SX1276 / SX1278) ---
constexpr float   LORA_FREQUENCY        = 915.0f; // MHz (เช่น 915.0 หรือ 868.0 หรือ 433.0 ตามความถี่ที่ใช้งาน)
constexpr float   LORA_BANDWIDTH        = 125.0f; // kHz
constexpr uint8_t LORA_SPREADING_FACTOR = 9;      // SF7 - SF12
constexpr uint8_t LORA_CODING_RATE      = 7;      // 4/7
constexpr int8_t  LORA_OUTPUT_POWER     = 14;     // dBm (2 - 20)
constexpr uint8_t LORA_SYNC_WORD        = 0x12;   // LoRa Sync Word

constexpr uint8_t PIN_LORA_SS           = 18;     // NSS / CS
constexpr uint8_t PIN_LORA_RST          = 14;     // Reset
constexpr uint8_t PIN_LORA_DIO0         = 26;     // DIO0 Interrupt
constexpr uint8_t PIN_LORA_DIO1         = 27;     // DIO1 (Option)