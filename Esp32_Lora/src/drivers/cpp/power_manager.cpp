#include "drivers/h/power_manager.h"
#include "config.h"

void PowerManager::begin() {
    pinMode(PIN_PMOS_GATE, OUTPUT);
    disableSensorPower(); // เริ่มต้นตัดไฟเซนเซอร์ไว้ก่อน
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db); // ช่วงอ่านค่า 0 - 3.3V
}

void PowerManager::enableSensorPower() {
    // P-MOSFET AO3401 ทำงานแบบ Active-Low: ดึง Gate ลง LOW เพื่อให้ VCC จ่ายไฟให้เซนเซอร์
    digitalWrite(PIN_PMOS_GATE, LOW);
    // รอเวลา 150ms ให้แรงดันไฟเลี้ยงและสัญญาณของโมดูลเซนเซอร์ (RS485, DHT, VEML) นิ่งพร้อมอ่านค่า
    delay(150);
}

void PowerManager::disableSensorPower() {
    // ดึง Gate เป็น HIGH เพื่อตัดไฟเลี้ยงเซนเซอร์ทั้งหมด ป้องกันไฟรั่วขณะ Deep Sleep
    digitalWrite(PIN_PMOS_GATE, HIGH);
}

float PowerManager::readBatteryVoltage() {
    // อ่านค่าเฉลี่ย 10 ตัวอย่างเพื่อลดสัญญาณรบกวน (Noise Filter)
    uint32_t adcSum = 0;
    for (int i = 0; i < 10; i++) {
        adcSum += analogRead(PIN_BATTERY_ADC);
        delay(2);
    }
    float rawAvg = adcSum / 10.0f;
    
    // คำนวณแรงดัน: ADC (12-bit = 4095), อ้างอิง 3.3V, วงจร Voltage Divider R1=100k, R2=100k (คูณ 2)
    // สามารถปรับค่า Factor ตามความต้านทานจริงของฮาร์ดแวร์
    constexpr float ADC_REF_VOLT = 3.3f;
    constexpr float DIVIDER_RATIO = 2.0f; 
    return (rawAvg / 4095.0f) * ADC_REF_VOLT * DIVIDER_RATIO;
}

uint16_t PowerManager::readBatteryMilliVolts() {
    float volt = readBatteryVoltage();
    return static_cast<uint16_t>(volt * 1000.0f);
}

bool PowerManager::isBatteryCritical(float voltage) {
    return voltage < BATTERY_CRITICAL_VOLT;
}

bool PowerManager::isBatteryLow(float voltage) {
    return voltage <= BATTERY_LOW_THRESH;
}