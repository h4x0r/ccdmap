import { NextResponse } from 'next/server';
import { getDbClient, initializeSchema } from '@/lib/db/client';
import type { NetworkSnapshotRecord } from '@/lib/db/schema';

/**
 * GET /api/tracking/network-history
 *
 * Returns network-wide metrics history
 *
 * Query params:
 * - since: Start timestamp (default: 15 minutes ago)
 * - until: End timestamp (default: now)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const now = Date.now();
    const since = parseInt(searchParams.get('since') || String(now - 15 * 60 * 1000));
    const until = parseInt(searchParams.get('until') || String(now));

    await initializeSchema();
    const db = getDbClient();

    const result = await db.execute(
      `SELECT * FROM network_snapshots
       WHERE timestamp >= ? AND timestamp <= ?
       ORDER BY timestamp ASC`,
      [since, until]
    );

    const history = (result.rows as unknown as NetworkSnapshotRecord[]).map(h => ({
      timestamp: h.timestamp,
      timestampISO: new Date(h.timestamp).toISOString(),
      totalNodes: h.total_nodes,
      healthyNodes: h.healthy_nodes,
      laggingNodes: h.lagging_nodes,
      issueNodes: h.issue_nodes,
      avgPeers: h.avg_peers,
      avgLatency: h.avg_latency,
      maxFinalizationLag: h.max_finalization_lag,
      consensusParticipation: h.consensus_participation,
      pulseScore: h.pulse_score,
    }));

    return NextResponse.json({
      success: true,
      timeRange: {
        since,
        until,
        sinceISO: new Date(since).toISOString(),
        untilISO: new Date(until).toISOString(),
      },
      dataPoints: history.length,
      history,
    });
  } catch (error) {
    console.error('Error fetching network history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch network history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
