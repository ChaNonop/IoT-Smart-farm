#pragma once
#include <Arduino.h>

class PowerManager {
public:
    void begin();
    bool state_SensorPower();   // ดึง GPIO LOW เพื่อเปิด P-MOSFET
    float readBatteryVoltage();
    bool isBatteryLow(float voltage);
};