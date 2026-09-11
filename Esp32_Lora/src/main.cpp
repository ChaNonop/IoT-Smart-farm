#include <Arduino.h>
#include <WiFi.h>
#include <config.h>
#include <Wire.h>
#include <dht.h>
#include <settings.h>
#include <Adafruit_VEML7700.h>
#include <RadioLib.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include <RTClib.h>

#include <telemetry.h>
#include <sensor_dht.h>
#include <power_manager.h>

Adafruit_VEML7700 veml;

void setup() {
  // ตัวแปร WIFI_SSID และ WIFI_PASSWORD ถูกส่งมาจาก compiler flag โดยตรง
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void loop() {

}