# Core Project Map

## Project Invariants
- Application Name: Job Punch System (JPS)
- Base URL: http://localhost:4028 (development) / https://app.craftwrk.online (production)
- Purpose: Secure geofenced attendance tracking application utilizing local JSON database.

## Critical References
- `mem:tech_stack` - Next.js App Router, Tailwind CSS, TypeScript, and self-hosted Node server.
- `mem:conventions` - Server-side JSON database logging, local IP geofencing, PWA manifest configurations.
- `mem:deployment` - PM2 and Nginx reverse proxy configuration on Ubuntu VPS for app.craftwrk.online.