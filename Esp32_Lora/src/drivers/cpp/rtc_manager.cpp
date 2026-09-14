#include "drivers/h/rtc_manager.h"
#include "config.h"

bool RtcManager::begin() {
    if (!rtc.begin()) {
        Serial.println("[RTC] Could not find DS3231 module!");
        return false;
    }

    // ปิดสัญญาณความถี่ 32kHz ที่ขา 32K เพื่อประหยัดพลังงาน
    rtc.disable32K();

    // กำหนดโหมดขา SQW ให้เป็น Interrupt สำหรับส่งสัญญาณ Alarm ไปปลุก ESP32
    rtc.writeSqwPinMode(DS3231_OFF);

    // ล้างค่าสถานะ Alarm เดิม
    clearAlarms();

    if (rtc.lostPower()) {
        Serial.println("[RTC] RTC lost power, setting compile time...");
        rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }

    return true;
}

DateTime RtcManager::getCurrentTime() {
    return rtc.now();
}

void RtcManager::clearAlarms() {
    rtc.clearAlarm(1);
    rtc.clearAlarm(2);
}

void RtcManager::setAlarmAfterSeconds(uint32_t seconds) {
    clearAlarms();

    // ปิด Alarm 2 ใช้เฉพาะ Alarm 1
    rtc.disableAlarm(2);

    DateTime now = rtc.now();
    DateTime wakeTime = now + TimeSpan(seconds);

    // ตั้ง Alarm 1 ให้ส่งสัญญาณ Interrupt เมื่อถึงวัน/เวลาที่กำหนด
    rtc.setAlarm1(wakeTime, DS3231_A1_Date);
    Serial.printf("[RTC] Alarm set for: %02d:%02d:%02d (in %u seconds)\n",
                  wakeTime.hour(), wakeTime.minute(), wakeTime.second(), seconds);
}

void RtcManager::prepareForDeepSleep() {
    // กำหนดให้ขา INT ของ DS3231 (Active-Low) ปลุก ESP32 จาก Deep Sleep ผ่าน EXT0
    esp_sleep_enable_ext0_wakeup(PIN_RTC_INT, 0); // ปลุกเมื่อขานี้เป็น 0 (LOW)
}
