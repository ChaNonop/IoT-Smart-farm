#include "drivers/h/sensor_hub.h"
#include "config.h"
#include <SPI.h>

// Modbus RTU Frame สำหรับสั่งอ่าน NPK (Address 1, Function 03, Register 0x001E, 3 Registers)
// CRC: 0x65, 0xCD
static const uint8_t NPK_QUERY_CMD[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};

SensorHub::SensorHub() : dht(PIN_DHT, DHT22) {}

void SensorHub::begin() {
    // 1. เริ่มต้น DHT22
    dht.begin();

    // 2. เริ่มต้น VEML7700 (I2C)
    if (veml.begin()) {
        veml.setGain(VEML7700_GAIN_1);
        veml.setIntegrationTime(VEML7700_IT_100MS);
        vemlReady = true;
    } else {
        Serial.println("[SensorHub] VEML7700 sensor not found!");
        vemlReady = false;
    }

    // 3. เริ่มต้นขาสำหรับ MAX6675 Thermocouple
    pinMode(PIN_THERMO_CS, OUTPUT);
    digitalWrite(PIN_THERMO_CS, HIGH);

    // 4. เริ่มต้นขาควบคุม RS485 Transceiver (MAX485)
    pinMode(PIN_RS485_DE_RE, OUTPUT);
    digitalWrite(PIN_RS485_DE_RE, LOW); // เริ่มต้นโหมดรับ (Receive)
    Serial2.begin(9600, SERIAL_8N1, PIN_RS485_RX, PIN_RS485_TX);
}

float SensorHub::readThermocouple() {
    // อ่านข้อมูล 16 บิตจากโมดูล MAX6675 ผ่าน SPI
    digitalWrite(PIN_THERMO_CS, LOW);
    delayMicroseconds(2);

    uint16_t v = 0;
    // อ่าน 16 บิตแบบ Bit-bang หรือ SPI
    for (int i = 15; i >= 0; i--) {
        // ใช้ SPI transfer 2 bytes หรือ Hardware SPI
        // หากต่อร่วมกับ SPI Bus:
    }
    // ใช้ SPI transaction มาตรฐาน
    SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));
    digitalWrite(PIN_THERMO_CS, LOW);
    v = SPI.transfer16(0x0000);
    digitalWrite(PIN_THERMO_CS, HIGH);
    SPI.endTransaction();

    // Bit D2: ตรวจสอบว่าสาย Thermocouple ขาดหรือไม่ (1 = disconnected)
    if (v & 0x04) {
        return -999.0f; // สายสัญญาณหลุด
    }

    // เลื่อนบิต 3 บิตแรกออก แล้วคูณ 0.25 องศาเซลเซียส
    v >>= 3;
    return v * 0.25f;
}

void SensorHub::queryNPK(uint16_t &n, uint16_t &p, uint16_t &k) {
    n = 0; p = 0; k = 0;

    // เคลียร์ Buffer ขาเข้าของ Serial2
    while (Serial2.available()) {
        Serial2.read();
    }

    // สลับ MAX485 เป็นโหมดส่งข้อมูล (Transmit)
    digitalWrite(PIN_RS485_DE_RE, HIGH);
    delay(2);
    Serial2.write(NPK_QUERY_CMD, sizeof(NPK_QUERY_CMD));
    Serial2.flush();

    // สลับกลับเป็นโหมดรับข้อมูล (Receive)
    digitalWrite(PIN_RS485_DE_RE, LOW);

    // รอรับ Response (ควรตอบกลับ 11 ไบต์: Addr(1) + Func(1) + ByteCount(1) + N(2) + P(2) + K(2) + CRC(2))
    uint8_t response[11];
    uint32_t startMs = millis();
    int bytesRead = 0;

    while (millis() - startMs < 500 && bytesRead < 11) {
        if (Serial2.available()) {
            response[bytesRead++] = Serial2.read();
        }
    }

    if (bytesRead == 11 && response[0] == 0x01 && response[1] == 0x03) {
        n = (response[3] << 8) | response[4];
        p = (response[5] << 8) | response[6];
        k = (response[7] << 8) | response[8];
    } else {
        Serial.printf("[SensorHub] RS485 NPK read timeout or invalid (bytes=%d)\n", bytesRead);
    }
}

SensorReadings SensorHub::readAll() {
    SensorReadings r;

    // 1. DHT22
    float tempSum = 0;
    float humSum = 0;
    int validDhtCount = 0;

    for (int i = 0; i < 3; i++) {
        float t = dht.readTemperature();
        float h = dht.readHumidity();
        if (!isnan(t) && !isnan(h)) {
            tempSum += t;
            humSum += h;
            validDhtCount++;
        }
        delay(20);
    }

    r.air_temperature = (validDhtCount > 0) ? (tempSum / validDhtCount) : 0.0f;
    r.air_humidity    = (validDhtCount > 0) ? (humSum / validDhtCount) : 0.0f;

    // 2. VEML7700
    if (vemlReady) {
        r.ambient_light_lux = veml.readLux();
    } else {
        r.ambient_light_lux = 0.0f;
    }

    // 3. Thermocouple
    r.battery_surface_temp = readThermocouple();

    // 4. NPK Sensor
    queryNPK(r.npk_n, r.npk_p, r.npk_k);

    return r;
}
