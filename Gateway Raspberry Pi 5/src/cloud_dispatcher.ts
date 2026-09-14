import * as fs from 'fs';
import * as path from 'path';
import { TelemetryData } from './types';

export class CloudDispatcher {
  private apiUrl: string;
  private apiKey: string;
  private queueFilePath: string;
  private isFlushing: boolean = false;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || process.env.CLOUD_API_URL || 'http://localhost:3000/api/telemetry';
    this.apiKey = apiKey || process.env.GATEWAY_SECRET_KEY || 'default_secret_key';
    this.queueFilePath = path.join(__dirname, '../offline_queue.json');
  }

  public async dispatch(data: TelemetryData): Promise<boolean> {
    try {
      console.log(`[Dispatcher] Dispatching telemetry for MAC: ${data.mac_address} to ${this.apiUrl}...`);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log(`[Dispatcher] Telemetry successfully pushed to cloud for ${data.mac_address}`);
        // หากส่งสำเร็จ ให้ลองระบายคิวออฟไลน์ที่ค้างอยู่ (ถ้ามี)
        this.flushOfflineQueue();
        return true;
      } else {
        const errText = await response.text();
        console.error(`[Dispatcher] Cloud API returned error ${response.status}: ${errText}`);
        this.enqueueOffline(data);
        return false;
      }
    } catch (err: any) {
      console.warn(`[Dispatcher] Network error (${err.message}). Storing in offline queue...`);
      this.enqueueOffline(data);
      return false;
    }
  }

  private enqueueOffline(data: TelemetryData) {
    try {
      let queue: TelemetryData[] = [];
      if (fs.existsSync(this.queueFilePath)) {
        const fileContent = fs.readFileSync(this.queueFilePath, 'utf-8');
        queue = JSON.parse(fileContent || '[]');
      }
      queue.push(data);
      fs.writeFileSync(this.queueFilePath, JSON.stringify(queue, null, 2), 'utf-8');
      console.log(`[Dispatcher] Queued offline item. Total in queue: ${queue.length}`);
    } catch (e: any) {
      console.error(`[Dispatcher] Failed to write offline queue:`, e.message);
    }
  }

  private async flushOfflineQueue() {
    if (this.isFlushing || !fs.existsSync(this.queueFilePath)) return;
    this.isFlushing = true;

    try {
      const fileContent = fs.readFileSync(this.queueFilePath, 'utf-8');
      const queue: TelemetryData[] = JSON.parse(fileContent || '[]');
      if (queue.length === 0) {
        this.isFlushing = false;
        return;
      }

      console.log(`[Dispatcher] Flushing ${queue.length} offline items...`);
      const remaining: TelemetryData[] = [];

      for (const item of queue) {
        try {
          const res = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
            },
            body: JSON.stringify(item),
          });
          if (!res.ok) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      fs.writeFileSync(this.queueFilePath, JSON.stringify(remaining, null, 2), 'utf-8');
      console.log(`[Dispatcher] Flush finished. Remaining in queue: ${remaining.length}`);
    } catch (e: any) {
      console.error(`[Dispatcher] Error while flushing queue:`, e.message);
    } finally {
      this.isFlushing = false;
    }
  }
}
