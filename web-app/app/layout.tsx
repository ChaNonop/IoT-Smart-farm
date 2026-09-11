import './globals.css';
import React from 'react';

export const metadata = {
  title: '🌾 Smart Farm IoT Dashboard',
  description: 'Solar & LoRa Low-Power Smart Farm Monitoring Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
