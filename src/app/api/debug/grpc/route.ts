import { NextResponse } from 'next/server';

/**
 * GET /api/debug/grpc
 *
 * Debug endpoint to test gRPC connectivity with raw data
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    runtime: process.env.VERCEL ? 'vercel' : 'local',
  };

  try {
    // Dynamic import to match the client
    const { ConcordiumGRPCNodeClient, credentials } = await import(
      '@concordium/web-sdk/nodejs'
    );

    const client = new ConcordiumGRPCNodeClient(
      'grpc.mainnet.concordium.software',
      20000,
      credentials.createSsl(),
      { timeout: 15000 }
    );

    const startTime = Date.now();
    const peersInfo = await client.getPeersInfo();
    const duration = Date.now() - startTime;

    results.success = true;
    results.rawPeersCount = peersInfo.length;
    results.durationMs = duration;

    if (peersInfo.length > 0) {
      // Show raw structure of first peer
      const firstPeer = peersInfo[0];
      results.rawFirstPeer = JSON.parse(
        JSON.stringify(firstPeer, (k, v) => (typeof v === 'bigint' ? v.toString() : v))
      );

      // Show all keys available
      results.peerKeys = Object.keys(firstPeer);
    }
  } catch (error) {
    results.success = false;
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.errorType = error?.constructor?.name;
  }

  return NextResponse.json(results);
}
