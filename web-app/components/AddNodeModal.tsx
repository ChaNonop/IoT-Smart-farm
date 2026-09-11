'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlusCircle, X } from 'lucide-react';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeAdded: () => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({ isOpen, onClose, onNodeAdded }) => {
  const [macAddress, setMacAddress] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // ตรวจสอบฟอร์แมต MAC Address
    const macRegex = /^([0-9A-FA-F]{2}:){5}([0-9A-FA-F]{2})$/;
    if (!macRegex.test(macAddress.trim())) {
      setErrorMsg('รูปแบบ MAC Address ไม่ถูกต้อง (ต้องเป็นรูปแบบ XX:XX:XX:XX:XX:XX)');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('nodes').insert({
        mac_address: macAddress.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || null,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setMacAddress('');
        setName('');
        setDescription('');
        onNodeAdded();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-slate-800">ลงทะเบียนโหนดใหม่ (Add Node)</h2>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              MAC Address ของ ESP32 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="24:62:AB:F3:12:10"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-slate-500 mt-1">สามารถดูได้จาก Serial Monitor ของบอร์ด ESP32 ตอนเปิดเครื่อง</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ชื่ออุปกรณ์ / แปลงปลูก <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="แปลงผักสลัด โซน A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              คำอธิบายเพิ่มเติม
            </label>
            <textarea
              rows={2}
              placeholder="ติดตั้งใต้แผงโซลาร์เซลล์ 10W หัวแปลงฝั่งทิศตะวันออก"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'เพิ่มอุปกรณ์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
