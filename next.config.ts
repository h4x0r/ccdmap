import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize gRPC packages to avoid bundling issues in serverless
  serverExternalPackages: [
    '@concordium/web-sdk',
    '@grpc/grpc-js',
    '@protobuf-ts/runtime-rpc',
    '@protobuf-ts/grpc-transport',
  ],
};

export default nextConfig;
