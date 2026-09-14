#include "network/lora_sender.h"
#include "config.h"

LoRaSender::LoRaSender() 
    : radio(new Module(PIN_LORA_SS, PIN_LORA_DIO0, PIN_LORA_RST, PIN_LORA_DIO1)) {}

bool LoRaSender::begin() {
    Serial.printf("[LoRa] Initializing SX1276 at %.1f MHz...\n", LORA_FREQUENCY);
    
    int state = radio.begin(
        LORA_FREQUENCY,
        LORA_BANDWIDTH,
        LORA_SPREADING_FACTOR,
        LORA_CODING_RATE,
        LORA_SYNC_WORD,
        LORA_OUTPUT_POWER
    );

    if (state == RADIOLIB_ERR_NONE) {
        Serial.println("[LoRa] SX1276 initialized successfully!");
        initialized = true;
        return true;
    } else {
        Serial.printf("[LoRa] Initialization failed, code: %d\n", state);
        initialized = false;
        return false;
    }
}

bool LoRaSender::sendTelemetry(const TelemetryPayload &payload) {
    if (!initialized) {
        if (!begin()) return false;
    }

    Serial.printf("[LoRa] Transmitting packed telemetry (%u bytes)...\n", sizeof(payload));
    uint32_t startMs = millis();
    
    int state = radio.transmit(reinterpret_cast<const uint8_t*>(&payload), sizeof(payload));
    uint32_t elapsedMs = millis() - startMs;

    if (state == RADIOLIB_ERR_NONE) {
        Serial.printf("[LoRa] Transmission successful! (Airtime ~%u ms)\n", elapsedMs);
        return true;
    } else {
        Serial.printf("[LoRa] Transmission failed, code: %d\n", state);
        return false;
    }
}

void LoRaSender::sleep() {
    if (initialized) {
        radio.sleep();
        Serial.println("[LoRa] Radio entered sleep mode.");
    }
}
