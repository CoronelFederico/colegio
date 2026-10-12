/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  /* config options here */

  images: {
    unoptimized: true, // 👈 Agregá esta línea
  },
};

export default nextConfig;
