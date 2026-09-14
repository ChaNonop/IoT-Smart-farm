#pragma once
#include <Arduino.h>
#include <DHT.h>
#include <Adafruit_VEML7700.h>

struct SensorReadings {
    float air_temperature;    // องศาเซลเซียส
    float air_humidity;       // %RH
    float battery_surface_temp;// องศาเซลเซียส จาก K-Type Thermocouple
    float ambient_light_lux;  // Lux
    uint16_t npk_n;           // mg/kg
    uint16_t npk_p;           // mg/kg
    uint16_t npk_k;           // mg/kg
};

class SensorHub {
private:
    DHT dht;
    Adafruit_VEML7700 veml;
    bool vemlReady = false;

    float readThermocouple();
    void queryNPK(uint16_t &n, uint16_t &p, uint16_t &k);

public:
    SensorHub();
    void begin();
    SensorReadings readAll();
};
