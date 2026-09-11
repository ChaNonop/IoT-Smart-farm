'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AddNodeModal } from '../../components/AddNodeModal';
import { 
  Battery, 
  Thermometer, 
  Droplets, 
  Sun, 
  Radio, 
  Sprout, 
  AlertTriangle, 
  Plus, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface TelemetryRow {
  id: number;
  mac_address: string;
  battery_voltage: number;
  surface_temp: number;
  air_temp: number;
  air_humidity: number;
  ambient_light: number;
  npk_n: number;
  npk_p: number;
  npk_k: number;
  rssi?: number;
  snr?: number;
  created_at: string;
}

interface NodeItem {
  id: string;
  mac_address: string;
  name: string;
  description?: string;
}

export default function DashboardPage() {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [selectedMac, setSelectedMac] = useState<string>('');
  const [historyData, setHistoryData] = useState<TelemetryRow[]>([]);
  const [latestData, setLatestData] = useState<TelemetryRow | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [chartView, setChartView] = useState<'env' | 'npk' | 'power'>('env');

  // 1. โหลดรายการ Nodes ทั้งหมด
  const fetchNodes = async () => {
    const { data } = await supabase.from('nodes').select('*').order('created_at', { ascending: true });
    if (data && data.length > 0) {
      setNodes(data);
      if (!selectedMac) {
        setSelectedMac(data[0].mac_address);
      }
    }
  };

  // 2. โหลดข้อมูลประวัติล่าสุดของ Node ที่เลือก
  const fetchHistory = async (mac: string) => {
    if (!mac) return;
    const { data } = await supabase
      .from('telemetry_logs')
      .select('*')
      .eq('mac_address', mac)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data && data.length > 0) {
      setLatestData(data[0]);
      setHistoryData([...data].reverse());
    } else {
      setLatestData(null);
      setHistoryData([]);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  useEffect(() => {
    if (selectedMac) {
      fetchHistory(selectedMac);
    }
  }, [selectedMac]);

  // 3. เชื่อมต่อ Supabase Realtime (WebSocket CDC) เพื่อรับข้อมูลแบบสดๆ
  useEffect(() => {
    const channel = supabase
      .channel('public:telemetry_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry_logs' },
        (payload) => {
          const newRow = payload.new as TelemetryRow;
          console.log('[Realtime] New telemetry packet received:', newRow);

          if (!selectedMac || newRow.mac_address === selectedMac) {
            setLatestData(newRow);
            setHistoryData((prev) => {
              const updated = [...prev, newRow];
              return updated.slice(-30); // เก็บ 30 จุดล่าสุด
            });
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMac]);

  // คำนวณ Vapor Pressure Deficit (VPD) เพื่อประโยชน์ทางการเกษตร
  const vpd = useMemo(() => {
    if (!latestData) return null;
    const T = Number(latestData.air_temp);
    const RH = Number(latestData.air_humidity);
    // SVP (Saturated Vapor Pressure) ในหน่วย kPa
    const svp = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
    // AVP (Actual Vapor Pressure)
    const avp = svp * (RH / 100);
    return Number((svp - avp).toFixed(2));
  }, [latestData]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">🌾 Smart Farm Monitor</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isRealtimeActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              {isRealtimeActive ? 'Live Realtime' : 'Connecting...'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            ระบบติดตามสภาพแปลงเกษตรและสุขภาพแบตเตอรี่โซลาร์เซลล์ด้วย LoRa & Supabase
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Node Selector */}
          <select
            value={selectedMac}
            onChange={(e) => setSelectedMac(e.target.value)}
            className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {nodes.length === 0 && <option value="">ไม่พบ Node ที่ลงทะเบียน</option>}
            {nodes.map((n) => (
              <option key={n.mac_address} value={n.mac_address}>
                {n.name} ({n.mac_address})
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchHistory(selectedMac)}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            เพิ่ม Node
          </button>
        </div>
      </header>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Battery Voltage */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">แบตเตอรี่ LiFePO4</span>
            <Battery className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {latestData ? `${latestData.battery_voltage} V` : '--'}
            </span>
            <span className="text-xs text-slate-500">Nominal 3.2V</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (latestData?.battery_voltage ?? 0) < 3.2 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, (((latestData?.battery_voltage ?? 3.0) - 3.0) / (3.6 - 3.0)) * 100))}%`
              }}
            />
          </div>
        </div>

        {/* Card 2: Battery Surface Temp (Safety) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">อุณหภูมิผิวแบตเตอรี่</span>
            <Thermometer className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {latestData ? `${latestData.surface_temp} °C` : '--'}
            </span>
            {(latestData?.surface_temp ?? 0) > 45 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" /> ร้อนผิดปกติ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">ตรวจจับผ่าน K-Type Thermocouple</p>
        </div>

        {/* Card 3: Air Temp & Humidity + VPD */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">อากาศ & ความชื้น</span>
            <Droplets className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-800">
                {latestData ? `${latestData.air_temp}°C` : '--'}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ {latestData ? `${latestData.air_humidity}%` : '--'}</span>
            </div>
            {vpd !== null && (
              <span className="text-xs px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg font-medium">
                VPD: {vpd} kPa
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">DHT22 Digital Sensor</p>
        </div>

        {/* Card 4: Ambient Light */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">ความเข้มแสง</span>
            <Sun className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {latestData ? `${latestData.ambient_light.toLocaleString()}` : '--'}
            </span>
            <span className="text-xs text-slate-500">Lux</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">VEML7700 High Accuracy Ambient Light</p>
        </div>
      </div>

      {/* Soil NPK & LoRa Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Soil NPK */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-slate-800">ธาตุอาหารในดิน (NPK Soil Sensor - RS485 Modbus)</h2>
            </div>
            <span className="text-xs text-slate-500">หน่วย: มิลลิกรัม/กิโลกรัม (mg/kg)</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-xs font-semibold text-emerald-700">ไนโตรเจน (N)</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{latestData ? latestData.npk_n : '--'}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
              <span className="text-xs font-semibold text-amber-700">ฟอสฟอรัส (P)</span>
              <p className="text-2xl font-bold text-amber-900 mt-1">{latestData ? latestData.npk_p : '--'}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
              <span className="text-xs font-semibold text-purple-700">โพแทสเซียม (K)</span>
              <p className="text-2xl font-bold text-purple-900 mt-1">{latestData ? latestData.npk_k : '--'}</p>
            </div>
          </div>
        </div>

        {/* LoRa Signal & Device Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">สัญญาณ LoRa & Gateway</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">ความแรงสัญญาณ (RSSI):</span>
              <span className="font-semibold text-slate-700">{latestData?.rssi ? `${latestData.rssi} dBm` : '-65 dBm'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">อัตราส่วนคลื่นต่อสัญญาณรบกวน (SNR):</span>
              <span className="font-semibold text-slate-700">{latestData?.snr ? `${latestData.snr} dB` : '+9.2 dB'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">อัปเดตล่าสุดเมื่อ:</span>
              <span className="font-semibold text-slate-700">
                {latestData ? new Date(latestData.created_at).toLocaleTimeString('th-TH') : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart (Recharts) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">แนวโน้มข้อมูลย้อนหลัง (Historical Trends)</h2>
            <p className="text-xs text-slate-500">แสดงผลเส้นกราฟต่อเนื่องแบบ Real-time</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setChartView('env')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                chartView === 'env' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สภาพอากาศ & แสง
            </button>
            <button
              onClick={() => setChartView('npk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                chartView === 'npk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ธาตุอาหาร NPK
            </button>
            <button
              onClick={() => setChartView('power')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                chartView === 'power' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แบตเตอรี่ & ความร้อน
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="created_at" 
                tickFormatter={(val) => new Date(val).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                stroke="#94a3b8" 
                fontSize={12}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                labelFormatter={(val) => new Date(val).toLocaleString('th-TH')}
              />
              <Legend />

              {chartView === 'env' && (
                <>
                  <Line type="monotone" dataKey="air_temp" stroke="#ef4444" name="อุณหภูมิอากาศ (°C)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="air_humidity" stroke="#06b6d4" name="ความชื้น (%RH)" dot={false} strokeWidth={2} />
                </>
              )}

              {chartView === 'npk' && (
                <>
                  <Line type="monotone" dataKey="npk_n" stroke="#10b981" name="ไนโตรเจน (N)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="npk_p" stroke="#f59e0b" name="ฟอสฟอรัส (P)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="npk_k" stroke="#8b5cf6" name="โพแทสเซียม (K)" dot={false} strokeWidth={2} />
                </>
              )}

              {chartView === 'power' && (
                <>
                  <Line type="monotone" dataKey="battery_voltage" stroke="#3b82f6" name="แรงดันแบตเตอรี่ (V)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="surface_temp" stroke="#f97316" name="อุณหภูมิผิวแบตเตอรี่ (°C)" dot={false} strokeWidth={2} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal เพิ่ม Node */}
      <AddNodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNodeAdded={fetchNodes}
      />
    </div>
  );
}
