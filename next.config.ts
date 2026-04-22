import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/marketing-agent', destination: '/agents/lena-brand',       permanent: true },
      { source: '/coding-agent',    destination: '/agents/dev-lead',          permanent: true },
      { source: '/website-agent',   destination: '/agents/zara-competitor',   permanent: true },
      { source: '/agent-manager',   destination: '/settings',                 permanent: true },
    ]
  },
}

export default nextConfig
