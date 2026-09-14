#pragma once
#include <Arduino.h>
#include <RTClib.h>

class RtcManager {
private:
    RTC_DS3231 rtc;

public:
    bool begin();
    DateTime getCurrentTime();
    void setAlarmAfterSeconds(uint32_t seconds);
    void clearAlarms();
    void prepareForDeepSleep();
};