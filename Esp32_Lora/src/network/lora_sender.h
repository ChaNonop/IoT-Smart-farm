#pragma once
#include <Arduino.h>
#include <RadioLib.h>
#include "models/telemetry_data.h"

class LoRaSender {
private:
    SX1276 radio;
    bool initialized = false;

public:
    LoRaSender();
    bool begin();
    bool sendTelemetry(const TelemetryPayload &payload);
    void sleep();
};
