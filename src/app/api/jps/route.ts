import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { PunchRecord } from '@/app/jps/types/jps';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'jps_punches.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ punches: [], lastSynced: null }, null, 2));
  }
}

function readDataFile() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!raw.trim()) {
      const defaultValue = { punches: [], lastSynced: null };
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    const defaultValue = { punches: [], lastSynced: null };
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultValue, null, 2));
    } catch {}
    return defaultValue;
  }
}

export async function GET() {
  try {
    const data = readDataFile();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read punch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    if (action !== 'in' && action !== 'out') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const data = readDataFile();

    const record: PunchRecord = {
      id: `punch-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
    };

    data.punches.push(record);
    data.lastSynced = new Date().toISOString();

    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save punch record' }, { status: 500 });
  }
}
