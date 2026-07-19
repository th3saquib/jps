import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Job Punch System',
    short_name: 'JobPunch',
    description: 'Secure geofenced office presence tracker',
    start_url: '/jps/login',
    display: 'standalone',
    background_color: '#003056',
    theme_color: '#003056',
    icons: [
      {
        src: '/assets/images/app_logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
