import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
/** @type {import('next').NextConfig} */
  images: {
    domains: ['res.cloudinary.com'],
  }
};

export default nextConfig;


