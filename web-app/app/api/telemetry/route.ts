import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Schema สำหรับตรวจสอบความถูกต้องของข้อมูลจาก Gateway ด้วย Zod
export const telemetrySchema = z.object({
  mac_address: z.string().regex(/^([0-9A-FA-F]{2}:){5}([0-9A-FA-F]{2})$/, 'Invalid MAC address format'),
  battery_voltage: z.number().min(0).max(6),
  surface_temp: z.number(),
  air_temp: z.number(),
  air_humidity: z.number().min(0).max(100),
  ambient_light: z.number().min(0),
  npk: z.object({
    n: z.number().min(0),
    p: z.number().min(0),
    k: z.number().min(0),
  }),
  rssi: z.number().optional(),
  snr: z.number().optional(),
});

export async function POST(request: Request) {
  // 1. ตรวจสอบ API Key จาก Header
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.GATEWAY_SECRET_KEY || 'smart_farm_secret_token_12345';
  
  if (apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Gateway API Key' }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const data = telemetrySchema.parse(rawBody);

    // 2. เชื่อมต่อ Supabase ด้วย Service Role Key เพื่อบันทึกข้อมูล (Bypass RLS สำหรับระบบหลังบ้าน)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role'
    );

    const { error: insertError } = await supabaseAdmin.from('telemetry_logs').insert({
      mac_address: data.mac_address,
      battery_voltage: data.battery_voltage,
      surface_temp: data.surface_temp,
      air_temp: data.air_temp,
      air_humidity: data.air_humidity,
      ambient_light: data.ambient_light,
      npk_n: data.npk.n,
      npk_p: data.npk.p,
      npk_k: data.npk.k,
      rssi: data.rssi,
      snr: data.snr,
    });

    if (insertError) {
      console.error('[API] Database Insert Error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 3. ตรวจสอบเงื่อนไขการแจ้งเตือนฉุกเฉิน (Alert System)
    // เงื่อนไข: อุณหภูมิผิวแบตเตอรี่เกิน 45°C หรือแรงดันแบตเตอรี่ต่ำกว่า 3.3V
    const isOverheat = data.surface_temp > 45.0;
    const isLowBattery = data.battery_voltage < 3.3;

    if (isOverheat || isLowBattery) {
      console.warn(`[Alert] Critical Condition for ${data.mac_address}: Temp=${data.surface_temp}C, Bat=${data.battery_voltage}V`);

      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Smart Farm Alert <alert@smartfarm-iot.com>',
            to: [process.env.ALERT_EMAIL_RECIPIENT || 'farmer@example.com'],
            subject: `🚨 [แจ้งเตือนด่วน] โหนด ${data.mac_address} พบสภาวะผิดปกติ!`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #dc2626;">🚨 แจ้งเตือนสภาวะผิดปกติในแปลงเกษตร</h2>
                <p><strong>MAC Address:</strong> ${data.mac_address}</p>
                <p><strong>สถานะตรวจพบ:</strong></p>
                <ul>
                  ${isOverheat ? `<li style="color: #dc2626;">อุณหภูมิแบตเตอรี่สูงผิดปกติ: <strong>${data.surface_temp} °C</strong> (เกณฑ์ปลอดภัย <= 45°C)</li>` : ''}
                  ${isLowBattery ? `<li style="color: #ea580c;">แรงดันแบตเตอรี่ต่ำ: <strong>${data.battery_voltage} V</strong> (ควรชาร์จไฟ)</li>` : ''}
                </ul>
                <p><strong>อุณหภูมิอากาศ:</strong> ${data.air_temp} °C | <strong>ความชื้น:</strong> ${data.air_humidity} %RH</p>
                <p style="font-size: 12px; color: #6b7280;">ส่งจากระบบอัตโนมัติ Smart Farm IoT Monitoring System</p>
              </div>
            `,
          });
        } catch (mailErr: any) {
          console.error('[Alert] Failed to send email alert:', mailErr.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Telemetry data successfully ingested' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
