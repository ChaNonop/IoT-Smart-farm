#pragma once
#include <Arduino.h>

class PowerManager {
public:
    void begin();
    bool state_SensorPower();   
    void Sensor_read();
    float readBatteryVoltage();
    bool isBatteryLow(float voltage);
};