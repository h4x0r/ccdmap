import { NextResponse } from 'next/server';
import { ConcordiumClient } from '@/lib/concordium-client';

/**
 * GET /api/debug/grpc
 *
 * Debug endpoint to test gRPC connectivity using our ConcordiumClient
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    runtime: process.env.VERCEL ? 'vercel' : 'local',
  };

  try {
    // Test our ConcordiumClient directly
    const client = new ConcordiumClient('grpc.mainnet.concordium.software', 20000);

    const startTime = Date.now();
    const peers = await client.getPeersInfo();
    const duration = Date.now() - startTime;

    results.success = true;
    results.peersCount = peers.length;
    results.durationMs = duration;

    if (peers.length > 0) {
      results.samplePeers = peers.slice(0, 3).map(p => ({
        peerId: p.peerId,
        ipAddress: p.ipAddress,
        port: p.port,
        isBootstrapper: p.isBootstrapper,
        catchupStatus: p.catchupStatus,
      }));
    }

    // Also test raw SDK to compare
    const { ConcordiumGRPCNodeClient, credentials } = await import(
      '@concordium/web-sdk/nodejs'
    );
    const rawClient = new ConcordiumGRPCNodeClient(
      'grpc.mainnet.concordium.software',
      20000,
      credentials.createSsl(),
      { timeout: 15000 }
    );
    const rawPeers = await rawClient.getPeersInfo();
    results.rawSdkPeersCount = rawPeers.length;

  } catch (error) {
    results.success = false;
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.errorType = error?.constructor?.name;
    if (error instanceof Error) {
      results.stack = error.stack?.split('\n').slice(0, 5);
    }
  }

  return NextResponse.json(results);
}
