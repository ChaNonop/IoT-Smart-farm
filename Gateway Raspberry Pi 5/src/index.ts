import * as dotenv from 'dotenv';
import { SerialPort } from 'serialport';
import { parseLoRaPayload, EXPECTED_PAYLOAD_SIZE } from './payload_parser';
import { CloudDispatcher } from './cloud_dispatcher';

dotenv.config();

const PORT_PATH = process.env.SERIAL_PORT || '/dev/ttyUSB0';
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '115200', 10);

const dispatcher = new CloudDispatcher();

console.log('==================================================');
console.log('🌾 Smart Farm LoRa Gateway Service (Raspberry Pi 5)');
console.log(`📡 Target Serial Port: ${PORT_PATH} @ ${BAUD_RATE} bps`);
console.log('==================================================');

let port: SerialPort | null = null;

try {
  port = new SerialPort({
    path: PORT_PATH,
    baudRate: BAUD_RATE,
    autoOpen: true,
  });

  let rxBuffer = Buffer.alloc(0);

  port.on('open', () => {
    console.log(`[Gateway] Connected to Serial Port ${PORT_PATH}`);
  });

  port.on('data', async (chunk: Buffer) => {
    rxBuffer = Buffer.concat([rxBuffer, chunk]);

    // เมื่อสะสมข้อมูลครบขนาด 22 bytes หรือมากกว่า
    while (rxBuffer.length >= EXPECTED_PAYLOAD_SIZE) {
      const packet = rxBuffer.subarray(0, EXPECTED_PAYLOAD_SIZE);
      rxBuffer = rxBuffer.subarray(EXPECTED_PAYLOAD_SIZE);

      const telemetry = parseLoRaPayload(packet);
      if (telemetry) {
        console.log(`[Gateway] Valid LoRa Packet received from ${telemetry.mac_address}:`, telemetry);
        await dispatcher.dispatch(telemetry);
      }
    }
  });

  port.on('error', (err) => {
    console.error(`[Gateway] Serial Port Error:`, err.message);
    console.log(`[Gateway] Tip: If running in simulation or without USB LoRa module, set SIMULATION=true in .env`);
  });
} catch (e: any) {
  console.error(`[Gateway] Could not initialize SerialPort:`, e.message);
}

// โหมดจำลองข้อมูล (Simulation Mode สำหรับทดสอบระบบเมื่อไม่ได้ต่อ Hardware จริง)
if (process.env.SIMULATION === 'true') {
  console.log('[Gateway] *** SIMULATION MODE ACTIVE (Sending simulated packet every 30s) ***');
  setInterval(async () => {
    const dummyBuffer = Buffer.alloc(22);
    // MAC: 24:62:AB:F3:12:10
    dummyBuffer[0] = 0x24; dummyBuffer[1] = 0x62; dummyBuffer[2] = 0xAB;
    dummyBuffer[3] = 0xF3; dummyBuffer[4] = 0x12; dummyBuffer[5] = 0x10;
    
    dummyBuffer.writeUInt16LE(3550, 6); // 3.55V
    dummyBuffer.writeInt16LE(284, 8);   // 28.4 C (Battery surface)
    dummyBuffer.writeInt16LE(312, 10);  // 31.2 C (Air temp)
    dummyBuffer.writeUInt16LE(658, 12); // 65.8 %RH
    dummyBuffer.writeUInt16LE(1250, 14);// 1250 Lux
    dummyBuffer.writeUInt16LE(45, 16);  // N: 45 mg/kg
    dummyBuffer.writeUInt16LE(18, 18);  // P: 18 mg/kg
    dummyBuffer.writeUInt16LE(120, 20); // K: 120 mg/kg

    const simData = parseLoRaPayload(dummyBuffer, -65, 9.5);
    if (simData) {
      console.log('[Sim] Dispatching simulated LoRa packet...');
      await dispatcher.dispatch(simData);
    }
  }, 30000);
}
