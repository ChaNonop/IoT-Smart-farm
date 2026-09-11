#include "drivers/h/power_manager.h"
#include "config.h"

void PowerManager::begin() {
    pinMode(PIN_PMOS_GATE, OUTPUT);
    disableSensorPower(); // เริ่มต้นให้ตัดไฟไว้ก่อน
}

void PowerManager::enableSensorPower() {
    digitalWrite(PIN_PMOS_GATE, LOW); // Active Low สำหรับ P-MOSFET
    delay(50); // รอไฟนิ่งเพื่อให้เซนเซอร์บูตพร้อมอ่านค่า
}

void PowerManager::disableSensorPower() {
    digitalWrite(PIN_PMOS_GATE, HIGH);
}

float PowerManager::readBatteryVoltage() {
    int raw = analogRead(PIN_BATTERY_ADC); // อ่านค่า ADC 12-bit (0-4095) จากขา ADC
    // แปลงตามสูตร R-divider ของวงจร (ตัวอย่าง R1=100k, R2=100k ตัวคูณ = 2)
    return (raw / 4095.0f) * 3.3f * 2.0f;
}

bool PowerManager::isBatteryLow(float voltage) {
    return voltage <= BATTERY_LOW_THRESH;
}