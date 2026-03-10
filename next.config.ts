import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use webpack for Zoom SDK WASM and web worker support
  // Turbopack doesn't fully support these features yet
  webpack: (config, { isServer }) => {
    // Handle WASM files for Zoom Video SDK
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle web workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      },
    });

    // Fix for Zoom SDK assets
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  // Add empty turbopack config to silence the warning
  // We use webpack explicitly for Zoom SDK compatibility
  turbopack: {},
};

export default nextConfig;
