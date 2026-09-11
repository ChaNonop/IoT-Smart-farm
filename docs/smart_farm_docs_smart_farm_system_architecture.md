# 🌾 Smart Farm IoT & Web Application System Architecture Specification

เอกสารสรุปข้อกำหนดและสถาปัตยกรรมระบบ IoT Smart Farm พร้อมระบบควบคุมและติดตามผลผ่าน Web Application โดยละเอียด เพื่อใช้เป็นข้อมูลอ้างอิงสำหรับการพัฒนาโปรเจกต์และการสื่อสารกับทีมพัฒนา/AI Assistant

---

## 📌 1. ภาพรวมโปรเจกต์และขอบเขตการทำงาน (Project Scope & Objectives)

โปรเจกต์นี้มีวัตถุประสงค์เพื่อพัฒนาระบบฟาร์มอัจฉริยะแบบประหยัดพลังงาน (Low-power Smart Farming Node) ที่สามารถติดตั้งกลางแจ้งและทำงานได้อย่างต่อเนื่องผ่านพลังงานแสงอาทิตย์ (Solar-powered) ร่วมกับระบบสื่อสารระยะไกล LoRa และระบบ Web Application สำหรับติดตามผลและบริหารจัดการอุปกรณ์แบบ Real-time

### ขอบเขตการทำงาน (Scope of Work):
1. **Hardware Node (Hardware & Firmware)**:
   - ออกแบบและผลิต Custom Circuit Board (Socket Board) สำหรับต่อร่วมกับโมดูลสำเร็จรูป ESP32 + LoRa (SX1276/SX1278)
   - วงจรจัดการพลังงานด้วยแบตเตอรี่ LiFePO4 1S (3.2V - 3.65V) ขนาด 5Ah (32650) พร้อมวงจร Buck Step-down และโมดูลชาร์จ LiFePO4
   - ระบบ Power Gating โดยใช้ P-MOSFET เพื่อตัดการจ่ายไฟเลี้ยงเซนเซอร์ทั้งหมดในขณะที่ ESP32 อยู่ในโหมด Deep Sleep
   - อ่านค่าจากเซนเซอร์ 4 ชนิด: DHT22 (Temp/Humidity), NPK Sensor (RS485/Modbus), Thermocouple K-Type (MAX31855/MAX6675 สำหรับวัด Temp พื้นผิวแบตเตอรี่), และ VEML770 (Ambient Light)
   - ระบบวัดแรงดันแบตเตอรี่ผ่าน External Analog / Voltage Divider เพื่อประเมินระดับพลังงานคงเหลือ
   - Real-Time Clock (DS3231) สำหรับควบคุมรอบการตื่นอย่างแม่นยำ

2. **Gateway (Raspberry Pi 5)**:
   - รับข้อมูลผ่านคลื่น LoRa จาก Node ต่างๆ ในฟาร์ม
   - ประมวลผลข้อมูลผ่าน Node.js Service (SerialPort -> Hex Parsing -> Payload Structuring)
   - ส่งข้อมูลเข้าสู่ Next.js API Route ผ่าน HTTP POST พร้อมแนบ Secret Key (`X-API-Key`)

3. **Web Application & Backend (Next.js + Supabase)**:
   - **Frontend UI**: หน้า Dashboard พัฒนาด้วย Next.js (App Router), Tailwind CSS, Shadcn UI
   - **Real-time Monitoring**: แสดงผลข้อมูลเซนเซอร์ล่าสุดแบบ Real-time ผ่าน Supabase Realtime (WebSocket)
   - **Historical Data & Analytics**: แสดงผลกราฟเส้นด้วย **Recharts** พร้อมระบบกรองช่วงวันที่ (Date Range Picker) และการดูย้อนหลัง
   - **Device Provisioning (Add Node)**: ระบบลงทะเบียนเพิ่มกล่อง Node เข้าสู่ระบบโดยใช้ MAC Address และ Device Token ผ่านฟอร์ม Validation (Zod + React Hook Form)
   - **Authentication & Security**: ระบบ Login ผ่าน Google OAuth / Email ด้วย Supabase Auth และล็อกสิทธิ์การเข้าถึงข้อมูลด้วย Row Level Security (RLS)
   - **Alerting System**: ระบบส่งอีเมลแจ้งเตือนผ่าน **Resend** เมื่ออุณหภูมิหรือระดับแรงดันแบตเตอรี่ผิดปกติ
   - **Automated Testing**: ตรวจสอบความถูกต้องและเสถียรภาพของ Web Application ด้วย **Vitest**

---

## 🛠️ 2. เทคโนโลยีและสแต็กที่ใช้ (Tech Stack & Hardware Components)

### 🔌 Hardware Stack
| ส่วนประกอบ | รายละเอียด / สเปก | หน้าที่ในระบบ |
| :--- | :--- | :--- |
| **Main Microcontroller** | ESP32 + LoRa Module (SX1276/1278) | ประมวลผล อ่านค่าเซนเซอร์ และส่งข้อมูล LoRa |
| **Gateway** | Raspberry Pi 5 | ตัวรับสัญญาณ LoRa และทำหน้าที่เป็น Internet Gateway |
| **Battery** | LiFePO4 1S (32650) 3.2V 5Ah (16.5Wh) | แหล่งพลังงานหลักสำหรับ Node |
| **Solar Cell** | 6V - 9V / 5W - 10W | แหล่งพลังงานทดแทนสำหรับชาร์จแบตเตอรี่ |
| **Power Management** | Buck Converter + LiFePO4 Charger (TP5000) + P-MOSFET | ควบคุมการชาร์จแบตเตอรี่ และตัดไฟเซนเซอร์ตอน Sleep |
| **RTC Module** | DS3231 | นาฬิกาฐานเวลาสำหรับการตื่นจาก Deep Sleep |
| **Sensors** | DHT22, NPK RS485, Thermocouple, VEML770 | วัดอุณหภูมิ/ความชื้นอากาศ, NPK ในดิน, Temp แบตเตอรี่, แสง |

### 💻 Software & Web Application Stack
| Layer | เทคโนโลยี / Framework | หน้าที่การทำงาน |
| :--- | :--- | :--- |
| **Firmware Development** | C++ / PlatformIO (VS Code) | เขียนโค้ดควบคุม ESP32, Power Management, LoRa |
| **Gateway Script** | Node.js (JavaScript/ES6) | อ่านข้อมูลผ่าน UART/Serial จาก LoRa ยิงเข้า API Route |
| **Frontend Framework** | Next.js 14+ (App Router, React) | Web Application UI & Server Actions |
| **UI & Styling** | Tailwind CSS + Shadcn UI | ตกแต่งหน้าจอและใช้ UI Component สำเร็จรูป |
| **Form & Validation** | React Hook Form + Zod | จัดการฟอร์ม และ ตรวจสอบโครงสร้างข้อมูล (Validation) |
| **Data Visualization** | Recharts + date-fns | แสดงผลกราฟเส้น Dynamic และจัดการช่วงเวลา |
| **Database & Auth** | Supabase (PostgreSQL + RLS + Auth) | จัดการฐานข้อมูล, OAuth Login, Realtime WebSocket |
| **Email Service** | Resend SDK | ส่งอีเมลแจ้งเตือนเหตุการณ์ผิดปกติ |
| **Testing** | Vitest | ทำ Unit/Integration Test สำหรับ Web Application |
| **Deployment** | Vercel | โฮสติ้งสำหรับ Next.js Web Application |

---

## 🔄 3. สถาปัตยกรรมและการไหลของข้อมูล (System Architecture & Data Flow)

### 3.1 การไหลของข้อมูลในระบบ (Data Pipeline Flow)

```text
[ Sensors ]
    │
    ▼ (P-MOSFET Enabled)
[ ESP32 Node ] ───(LoRa Binary Payload 868/915MHz)───► [ LoRa Receiver + RPi 5 Gateway ]
    │ (Deep Sleep)                                                      │
    ▼                                                                   ▼ (SerialPort/UART)
[ Power Off ]                                                [ Node.js Gateway Script ]
                                                                        │
                                                                        ▼ (HTTP POST /api/telemetry + X-API-Key)
                                                             [ Next.js API Route (Server) ]
                                                                        │
                                                     ┌──────────────────┴──────────────────┐
                                                     ▼                                     ▼
                                           (Zod Validation)               (Check Condition Temp/Bat)
                                                     │                                     │
                                                     ▼                                     ▼
                                          [ Supabase DB (Service Role) ]        [ Resend Email Alert ]
                                                     │
                                                     ▼ (Postgres Change Event)
                                         [ Supabase Realtime WebSocket ]
                                                     │
                                                     ▼
                                           [ Next.js Web Dashboard ]
                                          ├── Real-time Cards
                                          └── Recharts Dynamic Line Chart
```

---

## ⚡ 4. การจัดการพลังงานและวงจร Hardware (Power Management & Circuit Design)

### 4.1 การตั้งค่าวงจรและ Power Gating
* **ปัญหา**: เซนเซอร์ NPK (RS485) และ VEML770 หากต่อไฟเลี้ยงตลอดเวลาจะใช้กระแส $10-30	ext{mA}$ ซึ่งจะทำให้แบตเตอรี่หมดภายใน $2-3$ วัน แม้ ESP32 จะนอน Deep Sleep ก็ตาม
* **การแก้ไข**: 
  - ใช้ **P-MOSFET (เช่น AO3401)** ทำหน้าที่เป็น Load Switch ตัดไฟเลี้ยง VCC (3.3V/5V) ของเซนเซอร์ทั้งหมด
  - ESP32 จะดึงขา GPIO LOW เพื่อเปิด P-MOSFET อ่านค่าเซนเซอร์เฉพาะตอน Active และปล่อย GPIO HIGH / Floating ก่อนเข้า Deep Sleep

### 4.2 การปรับสเกลการตื่นส่งข้อมูล (Adaptive Sleep Interval)
* **ภาวะปกติ (แบตเตอรี่ > 30% / > 3.3V)**: 
  - ESP32 ตื่นอ่านค่าและส่งข้อมูลผ่าน LoRa **ทุกๆ 5 นาที** (Active Time $pprox 1.5 - 2$ วินาที)
* **ภาวะพลังงานต่ำ (แบตเตอรี่ $\le$ 30% / $\le$ 3.3V)**:
  - ESP32 จะปรับเวลาการนอนเพิ่มขึ้นเป็น **ทุกๆ 10 นาที** เพื่อถนอมแบตเตอรี่ในวันที่แดดจัดน้อย

---

## 🔒 5. ระบบความปลอดภัย และการลงทะเบียน Node (Security & Provisioning)

### 5.1 ระบบลงทะเบียนอุปกรณ์เพิ่มในระบบ (Node Provisioning Workflow)
เพื่อแก้ปัญหาว่าจะเพิ่ม Node ใหม่เข้าบัญชีผู้ใช้อย่างไรให้ปลอดภัย:

1. **Device Identity**: ทุก ESP32 จะได้รับการบันทึก `MAC Address` และ `Device Token` (UUID) ลงใน Flash Memory (Preferences/EEPROM)
2. **Registration on Web UI**:
   - ผู้ใช้เข้าไปที่หน้า Dashboard แล้วกดปุ่ม **"Add Node"**
   - ผู้ใช้กรอก **MAC Address** และตั้งชื่อ Node (เช่น "กล่องแปลงผักกาด โซน A")
   - ระบบจะตรวจสอบการมีอยู่ของ Node และสิทธิ์ผ่าน Zod Validation
3. **Database Linking**:
   - ระบบทำการ Insert ลงตาราง `nodes` ใน Supabase โดยผูก `owner_id` เท่ากับ `auth.uid()` ของผู้ใช้ที่ Login อยู่

### 5.2 Row Level Security (RLS) Rules

```sql
-- 1. บังคับใช้ RLS กับตาราง nodes และ telemetry_logs
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;

-- 2. Policy: ผู้ใช้ดูได้เฉพาะ Node ของตัวเอง
CREATE POLICY "Users can view own nodes" 
ON nodes FOR SELECT 
USING (auth.uid() = owner_id);

-- 3. Policy: ผู้ใช้ดูข้อมูล telemetry ได้เฉพาะ Node ที่ตนเองเป็นเจ้าของ
CREATE POLICY "Users can view telemetry from own nodes" 
ON telemetry_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM nodes 
    WHERE nodes.mac_address = telemetry_logs.mac_address 
    AND nodes.owner_id = auth.uid()
  )
);
```

---

## 💻 6. โครงสร้างซอร์สโค้ด และ ตัวอย่างการทำงาน (Code Architecture & Examples)

### 6.1 โครงสร้างโฟลเดอร์โปรเจกต์ (Monorepo Layout)

```text
smart-farm-iot/
├── firmware/                     👈 PlatformIO Project (ESP32)
│   ├── src/
│   │   └── main.cpp              👈 ESP32 Power Management, Sensor Reading & LoRa
│   └── platformio.ini
│
├── gateway/                      👈 Raspberry Pi 5 Gateway Service
│   ├── src/
│   │   └── index.js              👈 SerialPort Listener & HTTP Dispatcher
│   └── package.json
│
└── web-app/                      👈 Next.js Web Application
    ├── app/
    │   ├── api/
    │   │   └── telemetry/
    │   │       └── route.ts      👈 API Ingestion Endpoint (Zod + Supabase + Resend)
    │   ├── dashboard/
    │   │   └── page.tsx          👈 Dashboard Page
    │   └── login/
    │       └── page.tsx          👈 OAuth / Email Login
    ├── components/
    │   ├── TelemetryChart.tsx    👈 Recharts Dynamic Chart + Date Picker
    │   └── AddNodeModal.tsx      👈 Form เพิ่ม Node (React Hook Form + Zod)
    ├── tests/
    │   └── telemetry.test.ts     👈 Vitest Test Suite
    └── package.json
```

---

### 6.2 ตัวอย่าง Next.js API Route (`app/api/telemetry/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ใช้ Service Role เพื่อ bypass RLS สำหรับเขียนข้อมูล
);

// Zod Schema สำหรับตรวจเช็คข้อมูลจาก Gateway
const telemetrySchema = z.object({
  mac_address: z.string().regex(/^([0-9A-FA-F]{2}:){5}([0-9A-FA-F]{2})$/),
  battery_voltage: z.number().min(0).max(6),
  surface_temp: z.number(),
  air_temp: z.number(),
  air_humidity: z.number(),
  ambient_light: z.number(),
  npk: z.object({
    n: z.number(),
    p: z.number(),
    k: z.number(),
  }),
});

export async function POST(request: Request) {
  // 1. ตรวจสอบ API Key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.GATEWAY_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized Gateway' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = telemetrySchema.parse(body);

    // 2. บันทึกลง Supabase DB
    const { error } = await supabase.from('telemetry_logs').insert({
      mac_address: data.mac_address,
      battery_voltage: data.battery_voltage,
      surface_temp: data.surface_temp,
      air_temp: data.air_temp,
      air_humidity: data.air_humidity,
      ambient_light: data.ambient_light,
      npk_n: data.npk.n,
      npk_p: data.npk.p,
      npk_k: data.npk.k,
    });

    if (error) throw error;

    // 3. ตรวจสอบเงื่อนไขแจ้งเตือน (Alert System)
    if (data.surface_temp > 45.0 || data.battery_voltage < 3.3) {
      const { data: node } = await supabase
        .from('nodes')
        .select('name, owner_id')
        .eq('mac_address', data.mac_address)
        .single();

      if (node) {
        await resend.emails.send({
          from: 'Smart Farm Alert <alert@your-domain.com>',
          to: ['owner@example.com'],
          subject: `🚨 Alert: Node ${node.name} พบสภาวะผิดปกติ!`,
          html: `<p>Node <strong>${node.name}</strong> มีอุณหภูมิแบตเตอรี่ ${data.surface_temp}°C หรือ แรงดันแบตเตอรี่เหลือ ${data.battery_voltage}V</p>`,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Telemetry logged' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

---

### 6.3 ตัวอย่าง Vitest Test Suite (`tests/telemetry.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const telemetrySchema = z.object({
  mac_address: z.string().regex(/^([0-9A-FA-F]{2}:){5}([0-9A-FA-F]{2})$/),
  battery_voltage: z.number().min(0).max(6),
});

describe('Telemetry Ingestion Validation', () => {
  it('should pass with valid MAC and battery voltage', () => {
    const validData = {
      mac_address: '24:62:AB:F3:12:10',
      battery_voltage: 3.6,
    };
    expect(() => telemetrySchema.parse(validData)).not.toThrow();
  });

  it('should fail with invalid MAC address format', () => {
    const invalidData = {
      mac_address: 'INVALID-MAC-123',
      battery_voltage: 3.6,
    };
    expect(() => telemetrySchema.parse(invalidData)).toThrow();
  });
});
```

---

## 🎯 7. สรุปความพร้อมและก้าวถัดไป (Next Steps)

แผนงานทั้งหมดได้รับการออกแบบอย่างรัดกุม รองรับทั้งการผลิตจริงระดับ Hardware (Power Gating, Adaptive Sleep, Custom Circuit Board) และระดับ Web Software Infrastructure (Next.js, Supabase RLS, Zod, Vitest) สามารถนำเอกสารนี้ไปใช้เป็น **Blueprint** ในการเขียนโค้ดและส่งต่อให้ AI หรือทีมพัฒนาดำเนินการในขั้นตอนต่อไปได้ทันที
