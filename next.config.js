/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 👈 désactive le blocage
  },
};

module.exports = nextConfig; 