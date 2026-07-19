# Coding & Security Conventions

## Security
- Default login PIN is `5689`, validated server-side. Do not display PIN helper texts on client.
- Secure local IP verification: client requests must originate from configured gateway subnet (`192.168.1.X` or exact match). IPv6-mapped IPv4 addresses (prefixed with `::ffff:`) are automatically normalized.
- GPS watchPosition geofencing: matches decimal coordinates configured in `.env` within a 50m radius.

## Code conventions
- Server-side REST API calls are asynchronous (`loadData`, `addPunch`, `verifyPin`).
- Web App Manifest is generated dynamically in App Router via `src/app/manifest.ts` to support standalone mobile PWA installation.
- Prevent accidental clicks on mobile actions: use press-and-hold buttons with circular progress overlays rather than simple tap handlers.