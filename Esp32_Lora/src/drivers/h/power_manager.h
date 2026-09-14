#pragma once
#include <Arduino.h>

class PowerManager {
public:
    void begin();
    void enableSensorPower();
    void disableSensorPower();
    
    float readBatteryVoltage();
    uint16_t readBatteryMilliVolts();
    
    bool isBatteryCritical(float voltage);
    bool isBatteryLow(float voltage);
};