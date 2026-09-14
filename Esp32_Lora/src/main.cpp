#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <esp_sleep.h>

#include "config.h"
#include "models/telemetry_data.h"
#include "drivers/h/power_manager.h"
#include "drivers/h/rtc_manager.h"
#include "drivers/h/sensor_hub.h"
#include "network/lora_sender.h"

// ตัวแปร Manager ต่างๆ
PowerManager powerManager;
RtcManager   rtcManager;
SensorHub    sensorHub;
LoRaSender   loraSender;

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n==========================================");
    Serial.println("🌱 Smart Farm Low-Power LoRa Node Starting");
    Serial.println("==========================================");

    // 1. เริ่มต้นบัส I2C สำหรับ RTC DS3231 และ VEML7700
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

    // 2. เริ่มต้น Power Manager และ RTC Manager
    powerManager.begin();
    rtcManager.begin();

    // 3. ตรวจสอบระดับพลังงานแบตเตอรี่ก่อนเป็นลำดับแรก
    float batteryVolt = powerManager.readBatteryVoltage();
    Serial.printf("[Power] Battery Voltage: %.2f V\n", batteryVolt);

    // กรณีแบตเตอรี่วิกฤต (< 3.0V หรือ < 10%): ไม่เปิดเซนเซอร์ ให้หลับยาวรอชาร์จ
    if (powerManager.isBatteryCritical(batteryVolt)) {
        Serial.printf("[Power] CRITICAL BATTERY! (%.2fV < %.2fV). Sleeping for %u seconds...\n",
                      batteryVolt, BATTERY_CRITICAL_VOLT, SLEEP_SEC_CRITICAL);
        rtcManager.setAlarmAfterSeconds(SLEEP_SEC_CRITICAL);
        rtcManager.prepareForDeepSleep();
        Serial.flush();
        esp_deep_sleep_start();
    }

    // ประเมินช่วงเวลาหลับในรอบถัดไป
    uint32_t nextSleepSec = SLEEP_SEC_NORMAL;
    if (powerManager.isBatteryLow(batteryVolt)) {
        nextSleepSec = SLEEP_SEC_LOW_BATT;
        Serial.printf("[Power] Low Battery detected. Next sleep interval: %u sec\n", nextSleepSec);
    } else {
        Serial.printf("[Power] Normal Battery. Next sleep interval: %u sec\n", nextSleepSec);
    }

    // 4. Power Gating: ดึงขาสวิตช์เปิดไฟให้เซนเซอร์ทั้งหมด
    Serial.println("[Sensors] Enabling Power Gating (P-MOSFET)...");
    powerManager.enableSensorPower();

    // 5. อ่านค่าจากเซนเซอร์ทั้งหมด
    sensorHub.begin();
    SensorReadings readings = sensorHub.readAll();
    Serial.printf("[Sensors] Air Temp: %.1f C, Humidity: %.1f %%\n", readings.air_temperature, readings.air_humidity);
    Serial.printf("[Sensors] Battery Surface Temp: %.1f C, Light: %.1f Lux\n", readings.battery_surface_temp, readings.ambient_light_lux);
    Serial.printf("[Sensors] NPK -> N: %u, P: %u, K: %u mg/kg\n", readings.npk_n, readings.npk_p, readings.npk_k);

    // 6. ตัดไฟเลี้ยงเซนเซอร์ทันทีหลังอ่านเสร็จ เพื่อหยุดการใช้กระแส
    powerManager.disableSensorPower();
    Serial.println("[Sensors] Sensor power cut off.");

    // 7. บรรจุข้อมูลลงใน Binary Struct
    TelemetryPayload payload;
    esp_read_mac(payload.mac, ESP_MAC_WIFI_STA);
    payload.battery_mv        = powerManager.readBatteryMilliVolts();
    payload.surface_temp_x10  = static_cast<int16_t>(readings.battery_surface_temp * 10.0f);
    payload.air_temp_x10      = static_cast<int16_t>(readings.air_temperature * 10.0f);
    payload.air_humidity_x10  = static_cast<uint16_t>(readings.air_humidity * 10.0f);
    payload.ambient_light     = static_cast<uint16_t>(readings.ambient_light_lux);
    payload.npk_n             = readings.npk_n;
    payload.npk_p             = readings.npk_p;
    payload.npk_k             = readings.npk_k;

    Serial.printf("[Node] MAC Address: %02X:%02X:%02X:%02X:%02X:%02X\n",
                  payload.mac[0], payload.mac[1], payload.mac[2],
                  payload.mac[3], payload.mac[4], payload.mac[5]);

    // 8. ส่งข้อมูลผ่าน LoRa
    if (loraSender.begin()) {
        loraSender.sendTelemetry(payload);
        loraSender.sleep();
    } else {
        Serial.println("[LoRa] Skipping transmission due to radio error.");
    }

    // 9. ตั้งเวลาปลุกรอบถัดไปบน RTC DS3231 และกำหนดขา Interrupt Wakeup
    rtcManager.setAlarmAfterSeconds(nextSleepSec);
    rtcManager.prepareForDeepSleep();

    // 10. เข้าสู่ Deep Sleep
    Serial.println("[System] All tasks completed. Entering Deep Sleep now...");
    Serial.flush();
    esp_deep_sleep_start();
}

void loop() {
    // ไมโครคอนโทรลเลอร์ตื่นจาก Deep Sleep จะเริ่มทำงานที่ setup() เสมอ ลูปนี้จึงไม่ได้ใช้งาน
}