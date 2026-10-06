import type { MetadataRoute } from 'next';

// Lets phones "Add to Home Screen" with the app icon and open it full-screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beampad',
    short_name: 'Beampad',
    description: 'Type here, it appears on every device on your network',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#f8fafc',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
