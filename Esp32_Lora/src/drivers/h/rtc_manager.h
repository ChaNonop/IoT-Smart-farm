#pragma once
#include <Arduino.h>
#include "RTClib.h"

class RtcManager {
private:
    RTC_DS3231 rtc;
    char daysOfTheWeek[7][12] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
public:
    void begin();
    void Ntp_sync();
    void Cal_sleep_time();
    void Day_time();
    bool CoutTime_WakeUp();
    bool isbatteryLow(float voltage);
}