import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;

    const expectedPin = process.env.JPS_PIN || '5689';

    if (pin === expectedPin) {
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ authenticated: false, error: 'Incorrect PIN' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify PIN' }, { status: 500 });
  }
}
