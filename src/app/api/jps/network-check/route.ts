import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Try retrieving client IP from common forward headers, falling back to 127.0.0.1
  let clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // Normalize IPv6-mapped IPv4 addresses (e.g. ::ffff:192.168.1.8 -> 192.168.1.8)
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }

  // Allowed office IP from env
  const allowedIp = process.env.JPS_OFFICE_IP || '127.0.0.1';

  // Handle localhost checks (both IPv4 and IPv6 loopback variants)
  const isLocalhost =
    allowedIp === '127.0.0.1' &&
    (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');

  // Match exact IP, localhost, or check if both are in the same local subnet (e.g., 192.168.1.X)
  const isSameSubnet =
    (allowedIp.startsWith('192.168.1.') && clientIp.startsWith('192.168.1.')) ||
    (allowedIp.startsWith('10.0.0.') && clientIp.startsWith('10.0.0.')) ||
    (allowedIp.startsWith('172.16.') && clientIp.startsWith('172.16.'));

  const isAuthorized = clientIp === allowedIp || isLocalhost || isSameSubnet;

  const wifiName = process.env.NEXT_PUBLIC_OFFICE_WIFI_NAME || 'Office Wi-Fi';

  if (isAuthorized) {
    return NextResponse.json({
      status: 'authorized',
      networkName: wifiName,
      error: null,
    });
  } else {
    return NextResponse.json({
      status: 'unauthorized',
      networkName: null,
      error: `IP address (${clientIp}) is not authorized. Connect to ${wifiName}.`,
    });
  }
}
